import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  min_stock_level: number;
  unit_price: number;
  supplier: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_updated: string;
}

const Inventory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Add form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<string | undefined>(undefined);
  const [newItemQuantity, setNewItemQuantity] = useState<number | undefined>(undefined);
  const [newItemMinStock, setNewItemMinStock] = useState<number | undefined>(undefined);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState<number | undefined>(undefined);
  const [newItemSupplier, setNewItemSupplier] = useState("");
  const [newItemLocation, setNewItemLocation] = useState("");

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getInventory();

      if (data) {
        // Ensure status exists; compute if missing
        const normalized: InventoryItem[] = data.map((row: any) => {
          const quantity = Number(row.quantity ?? 0);
          const minStock = Number(row.min_stock_level ?? 0);
          let status: InventoryItem['status'] = 'in_stock';
          if (quantity <= 0) status = 'out_of_stock';
          else if (quantity < minStock) status = 'low_stock';
          return {
            id: row._id || row.id,
            name: row.name,
            description: row.description ?? '',
            category: row.category ?? 'Uncategorized',
            quantity,
            min_stock_level: minStock,
            unit_price: Number(row.unit_price ?? 0),
            supplier: row.supplier ?? '',
            location: row.location ?? '',
            status: (row.status as InventoryItem['status']) ?? status,
            last_updated: row.last_updated ?? row.updated_at ?? row.created_at ?? new Date().toISOString(),
          };
        });
        setItems(normalized);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName || !newItemCategory || newItemQuantity === undefined || newItemUnitPrice === undefined) {
      toast({ title: 'Missing fields', description: 'Please fill name, category, quantity, and unit price.', variant: 'destructive' });
      return;
    }

    // Compute status
    const quantity = Number(newItemQuantity);
    const minStock = Number(newItemMinStock ?? 0);
    let status: InventoryItem['status'] = 'in_stock';
    if (quantity <= 0) status = 'out_of_stock';
    else if (quantity < minStock) status = 'low_stock';

    const payload = {
      name: newItemName,
      description: newItemDescription,
      category: newItemCategory,
      quantity,
      min_stock_level: minStock,
      unit_price: Number(newItemUnitPrice),
      supplier: newItemSupplier,
      location: newItemLocation,
      status,
    };

    try {
      const data = await apiClient.createInventoryItem(payload);

      toast({ title: 'Item Added', description: 'New inventory item has been added successfully.' });

      // Optimistically add or refetch
      if (data) {
        setItems(prev => [{
          id: data._id || data.id,
          name: data.name,
          description: data.description ?? '',
          category: data.category ?? 'Uncategorized',
          quantity: Number(data.quantity ?? 0),
          min_stock_level: Number(data.min_stock_level ?? 0),
          unit_price: Number(data.unit_price ?? 0),
          supplier: data.supplier ?? '',
          location: data.location ?? '',
          status: (data.status as InventoryItem['status']) ?? status,
          last_updated: data.last_updated ?? data.updated_at ?? data.created_at ?? new Date().toISOString(),
        }, ...prev]);
      } else {
        fetchInventory();
      }

      // Reset form and close
      setNewItemName("");
      setNewItemDescription("");
      setNewItemCategory(undefined);
      setNewItemQuantity(undefined);
      setNewItemMinStock(undefined);
      setNewItemUnitPrice(undefined);
      setNewItemSupplier("");
      setNewItemLocation("");
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding inventory item:', error);
      toast({ title: 'Error', description: error.message || 'Failed to add item.', variant: 'destructive' });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_stock": return "default";
      case "low_stock": return "destructive";
      case "out_of_stock": return "secondary";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in_stock": return TrendingUp;
      case "low_stock": return AlertTriangle;
      case "out_of_stock": return TrendingDown;
      default: return Package;
    }
  };

  const categories = [...new Set(items.map(item => item.category))];
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const lowStockItems = items.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock');

  return (
    <Layout showSidebar={true}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Inventory Management</h2>
            <p className="text-muted-foreground">Track and manage company assets and supplies</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>
                  Add a new item to the company inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" className="col-span-3" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Input id="description" className="col-span-3" value={newItemDescription} onChange={e => setNewItemDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Networking">Networking</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Office">Office Supplies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">Quantity</Label>
                  <Input id="quantity" type="number" className="col-span-3" value={newItemQuantity ?? ''} onChange={e => setNewItemQuantity(e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="min_stock" className="text-right">Min Stock</Label>
                  <Input id="min_stock" type="number" className="col-span-3" value={newItemMinStock ?? ''} onChange={e => setNewItemMinStock(e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Unit Price</Label>
                  <Input id="price" type="number" className="col-span-3" value={newItemUnitPrice ?? ''} onChange={e => setNewItemUnitPrice(e.target.value === '' ? undefined : Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier" className="text-right">Supplier</Label>
                  <Input id="supplier" className="col-span-3" value={newItemSupplier} onChange={e => setNewItemSupplier(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">Location</Label>
                  <Input id="location" className="col-span-3" value={newItemLocation} onChange={e => setNewItemLocation(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-xs text-muted-foreground">
                Active inventory items
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Current inventory value
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Items need attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                Product categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Grid */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground text-lg">{loading ? 'Loading inventory...' : 'No inventory items found'}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search criteria or add new items.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const StatusIcon = getStatusIcon(item.status);
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <StatusIcon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </CardTitle>
                        <CardDescription>{item.category}</CardDescription>
                      </div>
                      <Badge variant={getStatusColor(item.status) as any}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold">{item.quantity}</div>
                        <div className="text-sm text-muted-foreground">In Stock</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-xl font-bold">{formatCurrency(item.unit_price)}</div>
                        <div className="text-sm text-muted-foreground">Unit Price</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supplier:</span>
                        <span>{item.supplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{item.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min Stock:</span>
                        <span>{item.min_stock_level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Value:</span>
                        <span className="font-semibold">{formatCurrency(item.quantity * item.unit_price)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inventory;