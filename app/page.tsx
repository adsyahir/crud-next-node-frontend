'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { axiosInstance } from '@/lib/axios';
import { formatDate } from '@/lib/utils';

interface Item {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}
const api = axiosInstance;
export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const getAllItems = async () : Promise<Item[]> => {
    try{
      const response = await api.get('/api/items')      
      return response.data;
    }catch(e){
      console.error(e)
      return [];
    }
  }
  const add = async (item: Item) => {
    console.log(item);
    try {
      await api.post('/api/items', item);
      setIsModalOpen(false);
      getAllItems().then(items => {
        setItems(items);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/items/${id}`);

      getAllItems().then(items => {
        setItems(items);
      });
  
    } catch (e) {
      console.error(e);
    }
  };

  const update = async (item: Item): Promise<void> => {
    try {
      await api.put(`/api/items/${item._id}`, item);
      setIsModalOpen(false);
      getAllItems().then(items => {
        setItems(items);
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    getAllItems().then(items => {
      setItems(items);
    });
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Items Management</h1>
          <Button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          >
            + Create New
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No items found. Create one to get started!
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          remove(item._id);
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Item' : 'Create New Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Make changes to your item here.'
                : 'Add a new item to your collection.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const itemData = {
                _id: editingItem?._id || '',
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                createdAt: editingItem?.createdAt || new Date().toISOString(),
              };

              if (editingItem) {
                update(itemData as Item);
              } else {
                add(itemData as Item);
              }
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingItem?.name || ''}
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingItem?.description || ''}
                  placeholder="Enter item description"
                  rows={4}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
