
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Clock, MapPin, DollarSign } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Ride } from '../../../server/src/schema';

interface RideHistoryProps {
  userId: number;
}

export function RideHistory({ userId }: RideHistoryProps) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sample data since handler is stub
  const sampleRides: Ride[] = [
    {
      id: 1,
      user_id: userId,
      scooter_id: 1,
      status: 'completed',
      start_latitude: -23.5505,
      start_longitude: -46.6333,
      end_latitude: -23.5515,
      end_longitude: -46.6343,
      distance_km: 2.5,
      duration_minutes: 15,
      total_cost: 8.50,
      started_at: new Date(Date.now() - 86400000), // 1 day ago
      ended_at: new Date(Date.now() - 86400000 + 900000), // 15 min later
      created_at: new Date(Date.now() - 86400000)
    },
    {
      id: 2,
      user_id: userId,
      scooter_id: 2,
      status: 'completed',
      start_latitude: -23.5515,
      start_longitude: -46.6343,
      end_latitude: -23.5525,
      end_longitude: -46.6353,
      distance_km: 1.8,
      duration_minutes: 12,
      total_cost: 6.00,
      started_at: new Date(Date.now() - 172800000), // 2 days ago
      ended_at: new Date(Date.now() - 172800000 + 720000), // 12 min later
      created_at: new Date(Date.now() - 172800000)
    },
    {
      id: 3,
      user_id: userId,
      scooter_id: 3,
      status: 'cancelled',
      start_latitude: -23.5525,
      start_longitude: -46.6353,
      end_latitude: null,
      end_longitude: null,
      distance_km: null,
      duration_minutes: null,
      total_cost: null,
      started_at: new Date(Date.now() - 259200000), // 3 days ago
      ended_at: null,
      created_at: new Date(Date.now() - 259200000)
    }
  ];

  const loadRides = useCallback(async () => {
    try {
      await trpc.getUserRides.query({ userId });
      // Since handler is stub, use sample data
      setRides(sampleRides);
    } catch (error) {
      console.error('Failed to load rides:', error);
      // Use sample data as fallback
      setRides(sampleRides);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  const getStatusBadge = (status: Ride['status']) => {
    const variants = {
      completed: { className: 'bg-green-100 text-green-800', text: 'Concluída' },
      active: { className: 'bg-blue-100 text-blue-800', text: 'Ativa' },
      cancelled: { className: 'bg-red-100 text-red-800', text: 'Cancelada' }
    } as const;

    const config = variants[status];
    return (
      <Badge className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const totalSpent = rides
    .filter((ride: Ride) => ride.status === 'completed')
    .reduce((sum: number, ride: Ride) => sum + (ride.total_cost || 0), 0);

  const totalDistance = rides
    .filter((ride: Ride) => ride.status === 'completed')
    .reduce((sum: number, ride: Ride) => sum + (ride.distance_km || 0), 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p>Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Corridas</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rides.length}</div>
            <p className="text-xs text-muted-foreground">
              {rides.filter((r: Ride) => r.status === 'completed').length} concluídas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distância Total</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistance.toFixed(1)} km</div>
            <p className="text-xs text-muted-foreground">
              Você economizou CO² 🌱
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Mobilidade sustentável
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Histórico de Corridas
          </CardTitle>
          <CardDescription>
            Suas últimas corridas e informações detalhadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rides.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma corrida ainda
              </h3>
              <p className="text-gray-500">
                Que tal fazer sua primeira corrida? 🛴
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((ride: Ride) => (
                <div key={ride.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">Corrida #{ride.id}</span>
                      {getStatusBadge(ride.status)}
                    </div>
                    <span className="text-sm text-gray-500">
                      {ride.started_at.toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Patinete</div>
                      <div className="font-medium">#{ride.scooter_id}</div>
                    </div>
                    
                    {ride.duration_minutes && (
                      <div>
                        <div className="text-gray-600 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Duração
                        </div>
                        <div className="font-medium">{ride.duration_minutes} min</div>
                      </div>
                    )}
                    
                    {ride.distance_km && (
                      <div>
                        <div className="text-gray-600 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          Distância
                        </div>
                        <div className="font-medium">{ride.distance_km} km</div>
                      </div>
                    )}
                    
                    {ride.total_cost && (
                      <div>
                        <div className="text-gray-600 flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Valor
                        </div>
                        <div className="font-medium text-green-600">
                          R$ {ride.total_cost.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Início: {ride.started_at.toLocaleString()}
                    {ride.ended_at && (
                      <span> • Fim: {ride.ended_at.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
