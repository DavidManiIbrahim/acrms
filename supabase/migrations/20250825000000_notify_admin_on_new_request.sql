-- Function and trigger to notify all admins when a new service request is created

-- Create function to insert notifications for admins
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_service_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  request_title TEXT;
BEGIN
  request_title := COALESCE(NEW.title, 'New Service Request');
  FOR admin_record IN
    SELECT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, read)
    VALUES (
      admin_record.user_id,
      'New Service Request',
      'A new service request has been created: ' || request_title,
      'info',
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger to call the function after insert on service_requests
DROP TRIGGER IF EXISTS trg_notify_admins_on_new_service_request ON public.service_requests;
CREATE TRIGGER trg_notify_admins_on_new_service_request
AFTER INSERT ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_service_request();

