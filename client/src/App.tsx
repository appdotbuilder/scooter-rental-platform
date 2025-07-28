
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Zap, 
  User as UserIcon, 
  CreditCard, 
  History, 
  Users,
  DollarSign,
  Activity,
  Navigation
} from 'lucide-react';
import { UserAuth } from '@/components/UserAuth';
import { ScooterMap } from '@/components/ScooterMap';
import { RideHistory } from '@/components/RideHistory';
import { PaymentCards } from '@/components/PaymentCards';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AdminScooters } from '@/components/AdminScooters';
import { AdminUsers } from '@/components/AdminUsers';
import { AdminPricing } from '@/components/AdminPricing';
import { AdminGeofences } from '@/components/AdminGeofences';
import { trpc } from '@/utils/trpc';
import type { User, Scooter, Ride } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [availableScooters, setAvailableScooters] = useState<Scooter[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);

  // Sample data for demonstration since handlers are stubs
  const sampleScooters: Scooter[] = [
    {
      id: 1,
      serial_number: 'SC001',
      status: 'available',
      battery_level: 85,
      latitude: -23.5505,
      longitude: -46.6333,
      is_locked: true,
      last_ping: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      serial_number: 'SC002',
      status: 'available',
      battery_level: 67,
      latitude: -23.5515,
      longitude: -46.6343,
      is_locked: true,
      last_ping: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 3,
      serial_number: 'SC003',
      status: 'in_use',
      battery_level: 42,
      latitude: -23.5525,
      longitude: -46.6353,
      is_locked: false,
      last_ping: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 4,
      serial_number: 'SC004',
      status: 'charging',
      battery_level: 15,
      latitude: -23.5535,
      longitude: -46.6363,
      is_locked: true,
      last_ping: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  const loadScooters = useCallback(async () => {
    try {
      await trpc.getAvailableScooters.query();
      // Since handler returns empty array, use sample data
      setAvailableScooters(sampleScooters);
    } catch (error) {
      console.error('Failed to load scooters:', error);
      // Use sample data as fallback
      setAvailableScooters(sampleScooters);
    }
  }, []);

  useEffect(() => {
    loadScooters();
  }, [loadScooters]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAdminMode(user.is_admin);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdminMode(false);
    setActiveRide(null);
  };

  const handleStartRide = async (scooterId: number) => {
    if (!currentUser) return;

    try {
      // Simulate starting a ride since backend is stub
      const newRide: Ride = {
        id: Date.now(),
        user_id: currentUser.id,
        scooter_id: scooterId,
        status: 'active',
        start_latitude: -23.5505,
        start_longitude: -46.6333,
        end_latitude: null,
        end_longitude: null,
        distance_km: null,
        duration_minutes: null,
        total_cost: null,
        started_at: new Date(),
        ended_at: null,
        created_at: new Date()
      };
      
      setActiveRide(newRide);
      
      // Update scooter status
      setAvailableScooters(prev => 
        prev.map(s => 
          s.id === scooterId 
            ? { ...s, status: 'in_use' as const, is_locked: false }
            : s
        )
      );
    } catch (error) {
      console.error('Failed to start ride:', error);
    }
  };

  const handleEndRide = async () => {
    if (!activeRide) return;

    try {
      // Simulate ending a ride
      setActiveRide(null);
      
      // Update scooter status back to available
      setAvailableScooters(prev => 
        prev.map(s => 
          s.id === activeRide.scooter_id 
            ? { ...s, status: 'available' as const, is_locked: true }
            : s
        )
      );
    } catch (error) {
      console.error('Failed to end ride:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-12 w-12 text-green-600 mr-2" />
              <h1 className="text-3xl font-bold text-gray-900">ScootShare</h1>
            </div>
            <p className="text-gray-600">Sua mobilidade urbana sustentável 🛴</p>
          </div>
          <UserAuth onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  if (isAdminMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-green-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">ScootShare Admin</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">👋 {currentUser.full_name}</Badge>
                <Button variant="outline" onClick={handleLogout}>
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="scooters" className="flex items-center space-x-2">
                <Navigation className="h-4 w-4" />
                <span>Patinetes</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Preços</span>
              </TabsTrigger>
              <TabsTrigger value="geofences" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Áreas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <AdminDashboard />
            </TabsContent>

            <TabsContent value="scooters">
              <AdminScooters scooters={availableScooters} />
            </TabsContent>

            <TabsContent value="users">
              <AdminUsers />
            </TabsContent>

            <TabsContent value="pricing">
              <AdminPricing />
            </TabsContent>

            <TabsContent value="geofences">
              <AdminGeofences />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">ScootShare</h1>
            </div>
            <div className="flex items-center space-x-4">
              {activeRide && (
                <Badge variant="default" className="bg-green-600">
                  🚀 Corrida ativa
                </Badge>
              )}
              <Badge variant="secondary">👋 {currentUser.full_name}</Badge>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeRide ? (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Activity className="h-5 w-5 mr-2" />
                Corrida em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-green-700">
                    Patinete: <span className="font-medium">#{activeRide.scooter_id}</span>
                  </p>
                  <p className="text-sm text-green-700">
                    Iniciado: {activeRide.started_at.toLocaleTimeString()}
                  </p>
                </div>
                <Button onClick={handleEndRide} className="bg-green-600 hover:bg-green-700">
                  Finalizar Corrida
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="map" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Mapa</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Histórico</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4" />
              <span>Perfil</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <ScooterMap 
              scooters={availableScooters} 
              onStartRide={handleStartRide}
              hasActiveRide={!!activeRide}
            />
          </TabsContent>

          <TabsContent value="history">
            <RideHistory userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentCards userId={currentUser.id} />
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Meu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                  <p className="text-gray-900">{currentUser.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{currentUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefone</label>
                  <p className="text-gray-900">{currentUser.phone || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Membro desde</label>
                  <p className="text-gray-900">{currentUser.created_at.toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
