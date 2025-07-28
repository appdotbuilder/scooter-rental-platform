
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DollarSign, 
  Plus, 
  Clock, 
  TrendingUp,
  Settings,
  Eye
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Pricing, CreatePricingInput } from '../../../server/src/schema';

export function AdminPricing() {
  const [pricingRules, setPricingRules] = useState<Pricing[]>([]);
  const [activePricing, setActivePricing] = useState<Pricing | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newPricingData, setNewPricingData] = useState<CreatePricingInput>({
    base_price: 3.00,
    price_per_minute: 0.50
  });

  // Sample data since handlers are stubs
  const samplePricingRules: Pricing[] = [
    {
      id: 1,
      base_price: 3.00,
      price_per_minute: 0.50,
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 7),
      updated_at: new Date()
    },
    {
      id: 2,
      base_price: 2.50,
      price_per_minute: 0.45,
      is_active: false,
      created_at: new Date(Date.now() - 86400000 * 30),
      updated_at: new Date(Date.now() - 86400000 * 7)
    },
    {
      id: 3,
      base_price: 4.00,
      price_per_minute: 0.60,
      is_active: false,
      created_at: new Date(Date.now() - 86400000 * 60),
      updated_at: new Date(Date.now() - 86400000 * 30)
    }
  ];

  const loadPricing = useCallback(async () => {
    try {
      await trpc.getActivePricing.query();
      // Since handlers are stubs, use sample data
      setPricingRules(samplePricingRules);
      setActivePricing(samplePricingRules.find((p: Pricing) => p.is_active) || null);
    } catch (error) {
      console.error('Failed to load pricing:', error);
      // Use sample data as fallback
      setPricingRules(samplePricingRules);
      setActivePricing(samplePricingRules.find((p: Pricing) => p.is_active) || null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  const handleCreatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await trpc.createPricing.mutate(newPricingData);
      
      // Add sample pricing rule
      const newRule: Pricing = {
        id: Date.now(),
        base_price: newPricingData.base_price,
        price_per_minute: newPricingData.price_per_minute,
        is_active: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setPricingRules((prev: Pricing[]) => [newRule, ...prev]);
      
      setNewPricingData({
        base_price: 3.00,
        price_per_minute: 0.50
      });
      
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to create pricing rule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateExampleCost = (basePrice: number, pricePerMinute: number, minutes: number) => {
    return basePrice + (pricePerMinute * minutes);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p>Carregando configurações de preço...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarifa Base Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {activePricing?.base_price.toFixed(2) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor fixo por corrida
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço por Minuto</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {activePricing?.price_per_minute.toFixed(2) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor adicional por minuto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exemplo (15 min)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {activePricing ? calculateExampleCost(activePricing.base_price, activePricing.price_per_minute, 15).toFixed(2) : '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Corrida típica de 15 minutos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Configuração de Preços
              </CardTitle>
              <CardDescription>
                Gerencie as tarifas da plataforma
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Configuração
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Configuração de Preços</DialogTitle>
                  <DialogDescription>
                    Defina uma nova estrutura de preços para a plataforma
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreatePricing} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tarifa Base (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="3.00"
                      value={newPricingData.base_price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewPricingData((prev: CreatePricingInput) => ({
                          ...prev,
                          base_price: parseFloat(e.target.value) || 0
                        }))
                      }
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Valor fixo cobrado no início de cada corrida
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Preço por Minuto (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.50"
                      value={newPricingData.price_per_minute}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewPricingData((prev: CreatePricingInput) => ({
                          ...prev,
                          price_per_minute: parseFloat(e.target.value) || 0
                        }))
                      }
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Valor adicional cobrado por cada minuto de uso
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Simulação de Preços</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div className="flex justify-between">
                        <span>5 minutos:</span>
                        <span>R$ {calculateExampleCost(newPricingData.base_price, newPricingData.price_per_minute, 5).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>15 minutos:</span>
                        <span>R$ {calculateExampleCost(newPricingData.base_price, newPricingData.price_per_minute, 15).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>30 minutos:</span>
                        <span>R$ {calculateExampleCost(newPricingData.base_price, newPricingData.price_per_minute, 30).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Criando...' : 'Criar Configuração'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pricingRules.map((pricing: Pricing) => (
              <Card key={pricing.id} className={`hover:shadow-md transition-shadow ${pricing.is_active ? 'ring-2 ring-green-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">
                          Configuração #{pricing.id}
                        </h3>
                        {pricing.is_active && (
                          <Badge className="bg-green-100 text-green-800">
                            Ativa
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Tarifa Base</div>
                          <div className="font-medium text-green-600">
                            R$ {pricing.base_price.toFixed(2)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-600">Por Minuto</div>
                          <div className="font-medium text-blue-600">
                            R$ {pricing.price_per_minute.toFixed(2)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-600">Exemplo (15 min)</div>
                          <div className="font-medium">
                            R$ {calculateExampleCost(pricing.base_price, pricing.price_per_minute, 15).toFixed(2)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-600">Criado em</div>
                          <div className="font-medium">
                            {pricing.created_at.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {!pricing.is_active && (
                        <Button size="sm" variant="outline">
                          Ativar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pricingRules.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma configuração de preços
              </h3>
              <p className="text-gray-500">
                Crie a primeira configuração de preços para a plataforma
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800">Dicas de Precificação 💡</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700">
          <ul className="space-y-2">
            <li>• Considere o custo operacional dos patinetes</li>
            <li>• Analise a concorrência local</li>
            <li>• Teste diferentes estruturas de preços</li>
            <li>• Monitore o impacto nos volumes de corridas</li>
            <li>• Considere promoções para horários específicos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
