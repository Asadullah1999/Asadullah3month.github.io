import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { GroceryListItem } from '@/components/ai/GroceryListItem';
import { ShoppingCart, Download, Printer } from 'lucide-react';

interface GroceryItem {
  ingredient: string;
  quantity: number;
  unit: string;
  category: string;
  checked?: boolean;
}

interface GroupedItems {
  [category: string]: GroceryItem[];
}

export default function GroceryListPage() {
  const [dietPlans, setDietPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [items, setItems] = useState<GroupedItems>({});
  const [loading, setLoading] = useState(false);
  const [listId, setListId] = useState<string | null>(null);

  useEffect(() => {
    fetchDietPlans();
  }, []);

  const fetchDietPlans = async () => {
    try {
      // TODO: Fetch from API when endpoint is available
      // For now, show placeholder
      setDietPlans([]);
    } catch (error) {
      console.error('Error fetching diet plans:', error);
    }
  };

  const handleGenerateList = async () => {
    if (!selectedPlanId) {
      toast.error('Please select a diet plan');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/grocery-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dietPlanId: selectedPlanId }),
      });

      const data = await response.json();
      if (data.success) {
        setItems(data.groceryList.items);
        setListId(data.groceryList.id);
        toast.success('Grocery list generated!');
      } else {
        toast.error(data.error || 'Failed to generate list');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate list');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (category: string, index: number) => {
    setItems((prev) => ({
      ...prev,
      [category]: prev[category].map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      ),
    }));
  };

  const handleDeleteItem = (category: string, index: number) => {
    setItems((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const handleExport = (format: 'pdf' | 'text') => {
    let content = 'GROCERY LIST\n\n';

    Object.entries(items).forEach(([category, categoryItems]) => {
      content += `${category.toUpperCase()}\n`;
      categoryItems.forEach((item) => {
        const checked = item.checked ? '☑' : '☐';
        content += `  ${checked} ${item.ingredient} - ${item.quantity} ${item.unit}\n`;
      });
      content += '\n';
    });

    if (format === 'text') {
      const element = document.createElement('a');
      element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(content)
      );
      element.setAttribute('download', 'grocery-list.txt');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      // For PDF, we'd need to integrate a library like jsPDF
      toast.success('PDF export coming soon!');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Smart Grocery List</h1>
        </div>

        {/* Controls */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Generate Shopping List</h2>
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Diet Plan
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                disabled={loading || dietPlans.length === 0}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Choose a plan...</option>
                {dietPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title}
                  </option>
                ))}
              </select>
              {dietPlans.length === 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  No active diet plans found. Create one first!
                </p>
              )}
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateList}
                disabled={loading || !selectedPlanId}
                className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Generating...' : 'Generate List'}
              </button>
            </div>
          </div>
        </Card>

        {/* Grocery List */}
        {listId && Object.keys(items).length > 0 && (
          <>
            {/* Export Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleExport('text')}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                <Download className="w-4 h-4" />
                Export as Text
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>

            {/* Items by Category */}
            <div className="space-y-6">
              {Object.entries(items).map(([category, categoryItems]) => (
                <Card key={category} className="p-6">
                  <h3 className="text-lg font-semibold mb-4 capitalize">{category}</h3>
                  <div className="space-y-2">
                    {categoryItems.map((item, idx) => (
                      <GroceryListItem
                        key={idx}
                        ingredient={item.ingredient}
                        quantity={item.quantity}
                        unit={item.unit}
                        checked={item.checked}
                        onToggle={(checked) => handleToggleItem(category, idx)}
                        onDelete={() => handleDeleteItem(category, idx)}
                      />
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card className="p-6 bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Shopping Summary</h3>
              <p className="text-blue-800">
                Total items: {Object.values(items).flat().length}
              </p>
              <p className="text-blue-800">
                Checked off: {Object.values(items).flat().filter((i) => i.checked).length}
              </p>
            </Card>
          </>
        )}

        {!listId && (
          <Card className="p-12 text-center text-gray-500">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Generate a grocery list to get started</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
