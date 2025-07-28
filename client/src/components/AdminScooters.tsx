
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Navigation, 
  Battery, 
  MapPin, 
  Plus, 
  Lock, 
  Unlock, 
  Settings,
  Search,
  Filter
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Scooter, CreateScooterInput, ScooterCommandInput } from '../../../server/src/schema';

interface AdminScootersProps {
  scooters: Scooter[];
}

export function AdminScooters({ scooters }: AdminScootersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newScooterData, setNewScooterData] = useState<CreateScooterInput>({
    serial_number: '',
    latitude: -23.5505,
    longitude: -46.6333
  });

  const filteredScooters = scooters.filter((scooter: Scooter) => {
    const matchesSearch = scooter.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || scooter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddScooter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await trpc.createScooter.mutate(newScooterData);
      // Since handler is stub, just close dialog
      setShowAddDialog(false);
      setNewScooterData({
        serial_number: '',
        latitude: -23.5505,
        longitude: -46.6333
      });
    } catch (error) {
      console.error('Failed to create scooter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScooterCommand = async (scooterId: number, command: 'lock' | 'unlock') => {
    try {
      const commandInput: ScooterCommandInput = {
        scooter_id: scooterId,
        command
      };
      
      await trpc.sendScooterCommand.mutate(commandInput);
      // In real app, this would update the scooter status in the list
    } catch (error) {
      console.error('Failed to send command:', error);
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: Scooter['status']) => {
    const variants = {
      available: { className: 'bg-green-100 text-green-800', text: 'Disponível' },
      in_use: { className: 'bg-blue-100 text-blue-800', text: 'Em uso' },
      maintenance: { className: 'bg-red-100 text-red-800', text: 'Manutenção' },
      charging: { className: 'bg-yellow-100 text-yellow-800', text: 'Carregando' }
    } as const;

    const config = variants[status];
    return (
      <Badge className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const statusCounts = {
    available: scooters.filter((s: Scooter) => s.status === 'available').length,
    in_use: scooters.filter((s: Scooter) => s.status === 'in_use').length,
    maintenance: scooters.filter((s: Scooter) => s.status === 'maintenance').length,
    charging: scooters.filter((s: Scooter) => s.status === 'charging').length
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-600"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Uso</CardTitle>
            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.in_use}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenção</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-600"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.maintenance}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carregando</CardTitle>
            <div className="h-2 w-2 rounded-full bg-yellow-600"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.charging}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Navigation className="h-5 w-5 mr-2" />
                Gerenciamento da Frota
              </CardTitle>
              <CardDescription>
                Monitor e controle de todos os patinetes
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Patinete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Patinete</DialogTitle>
                  <DialogDescription>
                    Registre um novo patinete na frota
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddScooter} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Número de série (ex: SC001)"
                      value={newScooterData.serial_number}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewScooterData((prev: CreateScooterInput) => ({
                          ...prev,
                          serial_number: e.target.value
                        }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        value={newScooterData.latitude}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewScooterData((prev: CreateScooterInput) => ({
                            ...prev,
                            latitude: parseFloat(e.target.value) || 0
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        value={newScooterData.longitude}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewScooterData((prev: CreateScooterInput) => ({
                            ...prev,
                            longitude: parseFloat(e.target.value) || 0
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Adicionando...' : 'Adicionar Patinete'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número de série..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="in_use">Em uso</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="charging">Carregando</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredScooters.map((scooter: Scooter) => (
              <Card key={scooter.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">#{scooter.serial_number}</CardTitle>
                    {getStatusBadge(scooter.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Battery className={`h-4 w-4 mr-2 ${getBatteryColor(scooter.battery_level)}`} />
                      <span className="text-sm">Bateria: {scooter.battery_level}%</span>
                    </div>
                    <span className={scooter.is_locked ? 'text-red-600' : 'text-green-600'}>
                      {scooter.is_locked ? '🔒' : '🔓'}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {scooter.latitude.toFixed(4)}, {scooter.longitude.toFixed(4)}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Último ping: {scooter.last_ping.toLocaleTimeString()}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant={scooter.is_locked ? "default" : "outline"}
                      onClick={() => handleScooterCommand(scooter.id, scooter.is_locked ? 'unlock' : 'lock')}
                      className="flex-1"
                    >
                      {scooter.is_locked ? (
                        <>
                          <Unlock className="h-3 w-3 mr-1" />
                          Desbloquear
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Bloquear
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredScooters.length === 0 && (
            <div className="text-center py-8">
              <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum patinete encontrado
              </h3>
              <p className="text-gray-500">
                Ajuste os filtros ou adicione novos patinetes à frota
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
