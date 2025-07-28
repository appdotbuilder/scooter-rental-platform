
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  MapPin, 
  Plus, 
  Eye, 
  Settings, 
  Trash2,
  Map,
  Shapes
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Geofence, CreateGeofenceInput } from '../../../server/src/schema';

export function AdminGeofences() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newGeofenceData, setNewGeofenceData] = useState<CreateGeofenceInput>({
    name: '',
    polygon_coordinates: ''
  });

  // Sample data since handlers are stubs
  const sampleGeofences: Geofence[] = [
    {
      id: 1,
      name: 'Centro de São Paulo',
      polygon_coordinates: JSON.stringify([
        [-46.6333, -23.5505],
        [-46.6290, -23.5505],
        [-46.6290, -23.5460],
        [-46.6333, -23.5460],
        [-46.6333, -23.5505]
      ]),
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 15),
      updated_at: new Date()
    },
    {
      id: 2,
      name: 'Vila Madalena',
      polygon_coordinates: JSON.stringify([
        [-46.6900, -23.5500],
        [-46.6850, -23.5500],
        [-46.6850, -23.5450],
        [-46.6900, -23.5450],
        [-46.6900, -23.5500]
      ]),
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 10),
      updated_at: new Date(Date.now() - 86400000 * 2)
    },
    {
      id: 3,
      name: 'Zona Teste - Desativada',
      polygon_coordinates: JSON.stringify([
        [-46.7000, -23.5600],
        [-46.6950, -23.5600],
        [-46.6950, -23.5550],
        [-46.7000, -23.5550],
        [-46.7000, -23.5600]
      ]),
      is_active: false,
      created_at: new Date(Date.now() - 86400000 * 30),
      updated_at: new Date(Date.now() - 86400000 * 5)
    }
  ];

  const loadGeofences = useCallback(async () => {
    try {
      await trpc.getGeofences.query();
      // Since handler is stub, use sample data
      setGeofences(sampleGeofences);
    } catch (error) {
      console.error('Failed to load geofences:', error);
      // Use sample data as fallback
      setGeofences(sampleGeofences);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGeofences();
  }, [loadGeofences]);

  const handleCreateGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate JSON coordinates
      JSON.parse(newGeofenceData.polygon_coordinates);
      
      await trpc.createGeofence.mutate(newGeofenceData);
      
      // Add sample geofence
      const newGeofence: Geofence = {
        id: Date.now(),
        name: newGeofenceData.name,
        polygon_coordinates: newGeofenceData.polygon_coordinates,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setGeofences((prev: Geofence[]) => [newGeofence, ...prev]);
      
      setNewGeofenceData({
        name: '',
        polygon_coordinates: ''
      });
      
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to create geofence:', error);
      alert('Erro: Coordenadas inválidas. Verifique o formato JSON.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCoordinateCount = (polygonCoordinates: string) => {
    try {
      const coordinates = JSON.parse(polygonCoordinates);
      return Array.isArray(coordinates) ? coordinates.length : 0;
    } catch {
      return 0;
    }
  };

  const activeGeofences = geofences.filter((g: Geofence) => g.is_active);
  const totalArea = geofences.length; // Simplified for demo

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p>Carregando áreas de operação...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Áreas Ativas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGeofences.length}</div>
            <p className="text-xs text-muted-foreground">
              Zonas de operação permitidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Áreas</CardTitle>
            <Shapes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geofences.length}</div>
            <p className="text-xs text-muted-foreground">
              Incluindo inativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArea * 15} km²</div>
            <p className="text-xs text-muted-foreground">
              Área aproximada de cobertura
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Áreas de Operação (Geofencing)
              </CardTitle>
              <CardDescription>
                Defina onde os patinetes podem ser usados
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Área
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Nova Área de Operação</DialogTitle>
                  <DialogDescription>
                    Defina um polígono que delimita onde os patinetes podem operar
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateGeofence} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome da Área</label>
                    <Input
                      placeholder="Ex: Centro de São Paulo"
                      value={newGeofenceData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewGeofenceData((prev: CreateGeofenceInput) => ({
                          ...prev,
                          name: e.target.value
                        }))
                      }
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Coordenadas do Polígono (JSON)</label>
                    <Textarea
                      placeholder='[[-46.6333, -23.5505], [-46.6290, -23.5505], [-46.6290, -23.5460], [-46.6333, -23.5460], [-46.6333, -23.5505]]'
                      value={newGeofenceData.polygon_coordinates}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNewGeofenceData((prev: CreateGeofenceInput) => ({
                          ...prev,
                          polygon_coordinates: e.target.value
                        }))
                      }
                      className="h-24"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Array de coordenadas [longitude, latitude] que formam o polígono
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Como obter coordenadas:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                      <li>Acesse <a href="https://geojson.io" target="_blank" className="underline" rel="noopener noreferrer">geojson.io</a></li>
                      <li>Desenhe o polígono no mapa</li>
                      <li>Copie as coordenadas da seção "coordinates"</li>
                      <li>Cole aqui no formato JSON</li>
                    </ol>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Criando...' : 'Criar Área'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Sample map visualization for MVP demonstration */}
          <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-lg p-8 mb-6 min-h-[300px] flex flex-col items-center justify-center">
            <Map className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Visualização do Mapa
            </h3>
            <p className="text-gray-600 text-center">
              Integração com Google Maps/Mapbox será implementada para<br />
              visualização interativa das áreas de geofencing
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {geofences.slice(0, 4).map((geofence: Geofence) => (
                <div
                  key={geofence.id}
                  className={`p-3 rounded-lg text-center ${
                    geofence.is_active ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <div className="font-medium text-sm">{geofence.name}</div>
                  <div className="text-xs">{getCoordinateCount(geofence.polygon_coordinates)} pontos</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {geofences.map((geofence: Geofence) => (
              <Card key={geofence.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">{geofence.name}</h3>
                        <Badge className={geofence.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {geofence.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Pontos do Polígono</div>
                          <div className="font-medium">
                            {getCoordinateCount(geofence.polygon_coordinates)} coordenadas
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-600">Criado em</div>
                          <div className="font-medium">
                            {geofence.created_at.toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-600">Última atualização</div>
                          <div className="font-medium">
                            {geofence.updated_at.toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-600">Status</div>
                          <div className="flex items-center space-x-2">
                            <Switch checked={geofence.is_active} />
                            <span className="text-sm">
                              {geofence.is_active ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {geofence.polygon_coordinates.substring(0, 50)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {geofences.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma área definida
              </h3>
              <p className="text-gray-500">
                Crie áreas de operação para delimitar onde os patinetes podem ser usados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">Sobre Geofencing 🗺️</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-orange-700">
          <ul className="space-y-2">
            <li>• Geofencing define áreas onde os patinetes podem operar</li>
            <li>• Patinetes fora das áreas são automaticamente bloqueados</li>
            <li>• Use ferramentas como geojson.io para criar polígonos</li>
            <li>• Coordenadas devem estar no formato [longitude, latitude]</li>
            <li>• Considere regulamentações locais ao definir áreas</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
