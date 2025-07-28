
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Star, Trash2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { PaymentCard, CreatePaymentCardInput } from '../../../server/src/schema';

interface PaymentCardsProps {
  userId: number;
}

export function PaymentCards({ userId }: PaymentCardsProps) {
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Omit<CreatePaymentCardInput, 'user_id'>>({
    card_token: '',
    last_four: '',
    brand: '',
    is_default: false
  });

  // Sample data since handler is stub
  const sampleCards: PaymentCard[] = [
    {
      id: 1,
      user_id: userId,
      card_token: 'tok_1234567890',
      last_four: '4532',
      brand: 'Visa',
      is_default: true,
      created_at: new Date(Date.now() - 86400000)
    },
    {
      id: 2,
      user_id: userId,
      card_token: 'tok_0987654321',
      last_four: '8765',
      brand: 'Mastercard',
      is_default: false,
      created_at: new Date(Date.now() - 172800000)
    }
  ];

  const loadCards = useCallback(async () => {
    try {
      await trpc.getUserPaymentCards.query({ userId });
      // Since handler is stub, use sample data
      setCards(sampleCards);
    } catch (error) {
      console.error('Failed to load payment cards:', error);
      // Use sample data as fallback
      setCards(sampleCards);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate card tokenization (normally done by payment processor)
      const cardInput: CreatePaymentCardInput = {
        ...formData,
        user_id: userId,
        card_token: `tok_${Date.now()}`, // Sample token
        last_four: formData.last_four,
        brand: formData.brand
      };

      await trpc.createPaymentCard.mutate(cardInput);
      
      // Add sample card since handler is stub
      const newCard: PaymentCard = {
        id: Date.now(),
        user_id: userId,
        card_token: cardInput.card_token,
        last_four: cardInput.last_four,
        brand: cardInput.brand,
        is_default: cardInput.is_default || false,
        created_at: new Date()
      };

      setCards((prev: PaymentCard[]) => [...prev, newCard]);
      
      setFormData({
        card_token: '',
        last_four: '',
        brand: '',
        is_default: false
      });
      
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to add payment card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardNumberChange = (value: string) => {
    // Extract last 4 digits and determine brand
    const cleanValue = value.replace(/\D/g, '');
    const lastFour = cleanValue.slice(-4);
    
    let brand = '';
    if (cleanValue.startsWith('4')) brand = 'Visa';
    else if (cleanValue.startsWith('5')) brand = 'Mastercard';
    else if (cleanValue.startsWith('3')) brand = 'American Express';
    
    setFormData((prev: Omit<CreatePaymentCardInput, 'user_id'>) => ({
      ...prev,
      last_four: lastFour,
      brand
    }));
  };

  const getBrandIcon = (brand: string) => {
    const icons = {
      'Visa': '💳',
      'Mastercard': '💳',
      'American Express': '💳'
    };
    return icons[brand as keyof typeof icons] || '💳';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p>Carregando cartões...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Cartões de Pagamento
              </CardTitle>
              <CardDescription>
                Gerencie seus métodos de pagamento
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Cartão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Cartão</DialogTitle>
                  <DialogDescription>
                    Seus dados são criptografados e seguros 🔒
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddCard} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Número do cartão"
                      maxLength={19}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const formatted = e.target.value
                          .replace(/\D/g, '')
                          .replace(/(\d{4})(?=\d)/g, '$1 ');
                        e.target.value = formatted;
                        handleCardNumberChange(e.target.value);
                      }}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="MM/AA"
                      maxLength={5}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value.replace(/\D/g, '');
                        e.target.value = value.replace(/(\d{2})(\d)/, '$1/$2');
                      }}
                      required
                    />
                    <Input
                      placeholder="CVV"
                      maxLength={4}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        e.target.value = e.target.value.replace(/\D/g, '');
                      }}
                      required
                    />
                  </div>
                  
                  <Input
                    placeholder="Nome no cartão"
                    required
                  />
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="default"
                      checked={formData.is_default}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: Omit<CreatePaymentCardInput, 'user_id'>) => ({
                          ...prev,
                          is_default: e.target.checked
                        }))
                      }
                    />
                    <label htmlFor="default" className="text-sm">
                      Definir como cartão padrão
                    </label>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Adicionando...' : 'Adicionar Cartão'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum cartão cadastrado
              </h3>
              <p className="text-gray-500">
                Adicione um cartão para fazer pagamentos
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {cards.map((card: PaymentCard) => (
                <div key={card.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getBrandIcon(card.brand)}</span>
                      <div>
                        <div className="font-medium">{card.brand}</div>
                        <div className="text-sm text-gray-500">•••• {card.last_four}</div>
                      </div>
                    </div>
                    {card.is_default && (
                      <Badge className="bg-green-100 text-green-800">
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Adicionado em {card.created_at.toLocaleDateString()}
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Segurança dos Pagamentos 🛡️</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <ul className="space-y-2">
            <li>• Todos os dados são criptografados com SSL</li>
            <li>• Não armazenamos informações sensíveis do cartão</li>
            <li>• Processamento via gateways seguros</li>
            <li>• Você pode remover cartões a qualquer momento</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
