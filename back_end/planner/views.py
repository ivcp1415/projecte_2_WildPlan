# back_end/rutes/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .models import Usuari, TokenJWT2, Ruta, ItinerariNode, Tram, Valoracio, Comentari
from .serializers import (
    LoginSerializer, RegistreSerializer, UsuariSerializer, UsuariUpdateSerializer,
    RutaSerializer, ValoracioSerializer, ComentariSerializer
)
from .services import authenticate_user, generate_token
from .permissions import RolePermission


@api_view(['POST'])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        user = authenticate_user(username, password)
        if user:
            token = generate_token(user)
            TokenJWT2.objects.create(user=user, token=token)
            return Response({
                'token': token,
                'username': user.username,
                'user_id': user.id,
                'rol': user.rol
            }, status=status.HTTP_200_OK)
        return Response({'error': 'Authentication failed'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def register(request):
    serializer = RegistreSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'missatge': 'Usuari creat correctament.'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def retrieve_usuari(request, pk):
    try:
        usuari = Usuari.objects.get(id=pk)
    except Usuari.DoesNotExist:
        return Response({'error': 'Usuari no trobat.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = UsuariSerializer(usuari)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([RolePermission])
def update_usuari(request, pk):
    try:
        usuari = Usuari.objects.get(id=pk)
    except Usuari.DoesNotExist:
        return Response({'error': 'Usuari no trobat.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Comprovem que l'usuari només pugui editar el seu propi perfil
    if usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = UsuariUpdateSerializer(usuari, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def list_rutes(request):
    rutes = Ruta.objects.all()
    serializer = RutaSerializer(rutes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def list_rutes_propies(request, pk):
    try:
        usuari = Usuari.objects.get(id=pk)
    except Usuari.DoesNotExist:
        return Response({'error': 'Usuari no trobat.'}, status=status.HTTP_404_NOT_FOUND)
    rutes = Ruta.objects.filter(usuari=usuari)
    serializer = RutaSerializer(rutes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def retrieve_ruta(request, pk):
    try:
        ruta = Ruta.objects.get(id=pk)
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no trobada.'}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        'ruta': RutaSerializer(ruta).data,
        'comentaris': ComentariSerializer(ruta.comentaris.all(), many=True).data,
        'valoracions': ValoracioSerializer(ruta.valoracions.all(), many=True).data,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([RolePermission])
def crear_rutes(request):
    serializer = RutaSerializer(data=request.data)
    if serializer.is_valid():
        # L'usuari s'extreu del token via RolePermission
        ruta_guardada = serializer.save(usuari=request.user) 
        
        trams_calculats = request.data.get('trams', [])
        nodes_calculats = request.data.get('nodes', [])
        nodes_bd = []
        
        for index, punt in enumerate(nodes_calculats):
            node = ItinerariNode.objects.create(
                ruta=ruta_guardada,
                ordre=index + 1,
                latitud=punt.get('latitud'),
                longitud=punt.get('longitud'),
                altitud=punt.get('altitud', 0.0)
            )
            nodes_bd.append(node)
            
        for i in range(len(nodes_bd) - 1):
            tram_data = trams_calculats[i] if i < len(trams_calculats) else {}
            Tram.objects.create(
                ruta=ruta_guardada,
                node_origen=nodes_bd[i],
                node_desti=nodes_bd[i + 1],
                distancia_metres=tram_data.get('distancia', 0.0), # Adaptat al nou nom de variable
                desnivell_positiu=tram_data.get('desnivell_positiu', 0),
                desnivell_negatiu=tram_data.get('desnivell_negatiu', 0)
            )
            
        return Response({
            "message": "Ruta desada correctament!",
            "ruta_id": ruta_guardada.id,
            "total_nodes": len(nodes_bd)
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([RolePermission])
def edit_rutes(request, pk):
    try:
        ruta = Ruta.objects.get(id=pk)
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no trobada.'}, status=status.HTTP_404_NOT_FOUND)
        
    if ruta.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís per editar aquesta ruta.'}, status=status.HTTP_403_FORBIDDEN)
        
    serializer = RutaSerializer(ruta, data=request.data)
    if serializer.is_valid():
        ruta_guardada = serializer.save()
        Tram.objects.filter(ruta=ruta_guardada).delete()
        ItinerariNode.objects.filter(ruta=ruta_guardada).delete()
        
        trams_calculats = request.data.get('trams', [])
        nodes_calculats = request.data.get('nodes', [])
        nodes_bd = []
        
        for index, punt in enumerate(nodes_calculats):
            node = ItinerariNode.objects.create(
                ruta=ruta_guardada,
                ordre=index + 1,
                latitud=punt.get('latitud'),
                longitud=punt.get('longitud'),
                altitud=punt.get('altitud', 0.0)
            )
            nodes_bd.append(node)
            
        for i in range(len(nodes_bd) - 1):
            tram_data = trams_calculats[i] if i < len(trams_calculats) else {}
            Tram.objects.create(
                ruta=ruta_guardada,
                node_origen=nodes_bd[i],
                node_desti=nodes_bd[i + 1],
                distancia_metres=tram_data.get('distancia', 0.0),
                desnivell_positiu=tram_data.get('desnivell_positiu', 0),
                desnivell_negatiu=tram_data.get('desnivell_negatiu', 0) # Afegit
            )
            
        return Response({
            "message": "Ruta editada amb èxit!",
            "ruta_id": ruta_guardada.id,
            "total_nodes_actualitzats": len(nodes_bd)
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([RolePermission])
def delete_ruta(request, pk):
    try:
        ruta = Ruta.objects.get(id=pk)
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    # Gràcies al RolePermission ja tenim request.user resolt i net
    if not hasattr(request, 'user') or request.user is None:
        return Response({'error': 'No autenticat.'}, status=status.HTTP_401_UNAUTHORIZED)

    if ruta.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís per eliminar aquesta ruta.'}, status=status.HTTP_403_FORBIDDEN)

    ruta.delete()
    return Response({'msg': "Ruta eliminada correctament"}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([RolePermission])
def add_opinion(request):
    # Serialitzem les dades de valoració assignant l'usuari loguejat
    val_serializer = ValoracioSerializer(data=request.data)
    
    if val_serializer.is_valid():
        valoracio = val_serializer.save(usuari=request.user)
        
        # Preparem les dades del comentari associat
        com_data = {
            'ruta': request.data.get('ruta'),
            'descripcio': request.data.get('descripcio'),
            'valoracio_rel': valoracio.id
        }
        
        com_serializer = ComentariSerializer(data=com_data)
        if com_serializer.is_valid():
            com_serializer.save(usuari=request.user)
            return Response({'missatge': 'Gràcies pel teu feedback!'}, status=status.HTTP_201_CREATED)
        else:
            valoracio.delete() # Fem rollback si falla el comentari
            return Response(com_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    return Response(val_serializer.errors, status=status.HTTP_400_BAD_REQUEST)