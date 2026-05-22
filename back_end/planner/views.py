"""back_end/planner/views.py"""

import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime

from .models import (
    Usuari, TokenJWT2, Ruta, ItinerariNode, Tram, Valoracio, Comentari,
    Material, Menjar, Motxilla, MotxillaMaterial, MotxillaMenjar,
    Planificacio, PressupostDespesa, RiscEstatic, AlertaDinamica
)
from .serializers import (
    LoginSerializer, RegistreSerializer, UsuariSerializer, UsuariUpdateSerializer,
    RutaSerializer, ValoracioSerializer, ComentariSerializer,
    MaterialSerializer, MenjarSerializer, MotxillaSerializer, MotxillaDetailSerializer,
    PlanificacioSerializer, PlanificacioDetailSerializer, PressupostDespesaSerializer,
    RiscEstaticSerializer, AlertaDinamicaSerializer
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
                track_geojson=tram_data.get('geometria_segment'),
                distancia_metres=tram_data.get('distancia', 0.0),
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
        
    serializer = RutaSerializer(ruta, data=request.data, partial=True)
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
                track_geojson=tram_data.get('geometria_segment'),
                distancia_metres=tram_data.get('distancia', 0.0),
                desnivell_positiu=tram_data.get('desnivell_positiu', 0),
                desnivell_negatiu=tram_data.get('desnivell_negatiu', 0)
            )

        return Response({
            "message": "Ruta editada amb èxit!",
            "ruta_id": ruta_guardada.id,
            "total_nodes_actualitzats": len(nodes_bd)
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([RolePermission])
def update_ruta_meta(request, pk):
    """Actualitza només les metadades d'una ruta (sense tocar nodes/trams).
    Pensat per a renomenar, canviar descripció, modalitat, dificultat o imatge."""
    try:
        ruta = Ruta.objects.get(id=pk)
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if ruta.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís per editar aquesta ruta.'}, status=status.HTTP_403_FORBIDDEN)

    # Whitelist de camps editables (no es permeten canvis a usuari, trams, etc.)
    camps_permesos = ['nom', 'descripcio', 'modalitat', 'dificultat', 'imatge_portada', 'temps_estimat']
    dades_filtrades = {k: v for k, v in request.data.items() if k in camps_permesos}

    serializer = RutaSerializer(ruta, data=dades_filtrades, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
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

@api_view(['DELETE'])
@permission_classes([RolePermission])
def delete_opinio(request, pk):
    try:
        # Busquem el comentari per la seva PK
        comentari = Comentari.objects.get(id=pk)
    except Comentari.DoesNotExist:
        return Response({'error': 'Opinió no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    # Comprovació de seguretat bàsica
    if not hasattr(request, 'user') or request.user is None:
        return Response({'error': 'No autenticat.'}, status=status.HTTP_401_UNAUTHORIZED)

    # Restricció: Només el propietari del comentari o un 'admin' ho poden eliminar
    if comentari.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís per eliminar aquesta opinió.'}, status=status.HTTP_403_FORBIDDEN)

    # Relació: Esborrem la Valoracio. Per l'on_delete=CASCADE del model Comentari, 
    # això eliminarà també el Comentari automàticament.
    valoracio = comentari.valoracio_rel
    if valoracio:
        valoracio.delete()
    else:
        # En cas que, per algun motiu d'inconsistència, no tingui valoració vinculada
        comentari.delete()

    return Response({'msg': "Opinió (valoració i comentari) eliminada correctament"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([RolePermission])
def clonar_ruta(request, pk):
    """Crea una còpia de la ruta indicada assignada a l'usuari autenticat.
    Inclou els nodes i trams, però sense planificacions ni valoracions/comentaris.
    El nom rep el sufix '(còpia)' si no se'n proporciona un de nou."""
    try:
        original = Ruta.objects.get(id=pk)
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    nom_nou = request.data.get('nom') or f"{original.nom} (còpia)"

    nova = Ruta.objects.create(
        nom=nom_nou,
        descripcio=original.descripcio,
        modalitat=original.modalitat,
        dificultat=original.dificultat,
        usuari=request.user,
        imatge_portada=original.imatge_portada,
        galeria_fotos=original.galeria_fotos,
        es_verificada=False,
        distancia=original.distancia,
        desnivell_positiu=original.desnivell_positiu,
        desnivell_negatiu=original.desnivell_negatiu,
        temps_estimat=original.temps_estimat,
        track_complet=original.track_complet,
        perfil_elevacio=original.perfil_elevacio,
    )

    # Copiar els nodes i mantenir el mapping per a recrear els trams
    nodes_map = {}
    for node_original in original.nodes.all():
        nou_node = ItinerariNode.objects.create(
            ruta=nova,
            ordre=node_original.ordre,
            latitud=node_original.latitud,
            longitud=node_original.longitud,
            altitud=node_original.altitud,
            es_waypoint=node_original.es_waypoint,
            nom_punt=node_original.nom_punt,
        )
        nodes_map[node_original.id] = nou_node

    for tram_original in original.trams.all():
        Tram.objects.create(
            ruta=nova,
            node_origen=nodes_map[tram_original.node_origen_id],
            node_desti=nodes_map[tram_original.node_desti_id],
            track_geojson=tram_original.track_geojson,
            distancia_metres=tram_original.distancia_metres,
            desnivell_positiu=tram_original.desnivell_positiu,
            desnivell_negatiu=tram_original.desnivell_negatiu,
            temps_estimat_minuts=tram_original.temps_estimat_minuts,
        )

    return Response({
        'msg': 'Ruta clonada correctament.',
        'ruta_id': nova.id,
        'nom': nova.nom
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def get_ruta_per_editar(request, pk):
    """Retorna els nodes i trams d'una ruta en format compatible amb l'editor frontend."""
    try:
        ruta = Ruta.objects.get(id=pk)
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    nodes = [
        {
            'ordre': n.ordre,
            'latitud': str(n.latitud),
            'longitud': str(n.longitud),
        }
        for n in ruta.nodes.order_by('ordre')
    ]

    trams = []
    for t in ruta.trams.select_related('node_origen', 'node_desti').order_by('node_origen__ordre'):
        if not t.track_geojson:
            continue
        trams.append({
            'origen_ordre': t.node_origen.ordre,
            'desti_ordre': t.node_desti.ordre,
            'distancia': float(t.distancia_metres or 0),
            'desnivell_positiu': t.desnivell_positiu or 0,
            'desnivell_negatiu': t.desnivell_negatiu or 0,
            'geometria_segment': t.track_geojson,
            'steepness': [],
        })

    return Response({
        'id': ruta.id,
        'nom': ruta.nom,
        'descripcio': ruta.descripcio or '',
        'modalitat': ruta.modalitat or 'senderisme',
        'imatge_portada': ruta.imatge_portada or '',
        'nodes': nodes,
        'trams': trams,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([RolePermission])
def verificar_ruta(request, pk):
    try:
        ruta = Ruta.objects.get(id=pk)
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    # Comprovació de seguretat addicional: només l'admin pot fer això
    if not hasattr(request, 'user') or request.user is None or getattr(request.user, 'rol', '') != 'admin':
        return Response({'error': 'Només els administradors poden verificar rutes.'}, status=status.HTTP_403_FORBIDDEN)

    # Canviem l'estat (de False a True, o de True a False si ho vols desfer algun cop)
    ruta.es_verificada = not ruta.es_verificada
    ruta.save()

    estat_actual = "verificada" if ruta.es_verificada else "desverificada"

    return Response({'msg': f"Ruta {estat_actual} correctament.", 'es_verificada': ruta.es_verificada}, status=status.HTTP_200_OK)


# ==========================================
# 4. CATÀLEG MATERIAL / MENJAR
# ==========================================
@api_view(['GET'])
def list_materials(request):
    materials = Material.objects.all()
    serializer = MaterialSerializer(materials, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([RolePermission])
def crear_material(request):
    serializer = MaterialSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def list_menjars(request):
    menjars = Menjar.objects.all()
    serializer = MenjarSerializer(menjars, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([RolePermission])
def crear_menjar(request):
    serializer = MenjarSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 5. MOTXILLA
# ==========================================
@api_view(['GET'])
@permission_classes([RolePermission])
def list_motxilles_usuari(request, pk):
    try:
        usuari = Usuari.objects.get(id=pk)
    except Usuari.DoesNotExist:
        return Response({'error': 'Usuari no trobat.'}, status=status.HTTP_404_NOT_FOUND)

    if usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    motxilles = Motxilla.objects.filter(usuari=usuari)
    serializer = MotxillaSerializer(motxilles, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([RolePermission])
def crear_motxilla(request):
    serializer = MotxillaSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(usuari=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([RolePermission])
def retrieve_motxilla(request, pk):
    try:
        motxilla = Motxilla.objects.get(id=pk)
    except Motxilla.DoesNotExist:
        return Response({'error': 'Motxilla no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if motxilla.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = MotxillaDetailSerializer(motxilla)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([RolePermission])
def update_motxilla(request, pk):
    try:
        motxilla = Motxilla.objects.get(id=pk)
    except Motxilla.DoesNotExist:
        return Response({'error': 'Motxilla no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if motxilla.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = MotxillaSerializer(motxilla, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([RolePermission])
def delete_motxilla(request, pk):
    try:
        motxilla = Motxilla.objects.get(id=pk)
    except Motxilla.DoesNotExist:
        return Response({'error': 'Motxilla no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if motxilla.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    motxilla.delete()
    return Response({'msg': 'Motxilla eliminada correctament'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([RolePermission])
def afegir_material_motxilla(request, pk):
    try:
        motxilla = Motxilla.objects.get(id=pk)
    except Motxilla.DoesNotExist:
        return Response({'error': 'Motxilla no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if motxilla.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    material_id = request.data.get('material_id')
    quantitat = request.data.get('quantitat', 1)

    try:
        material = Material.objects.get(id=material_id)
    except Material.DoesNotExist:
        return Response({'error': 'Material no trobat.'}, status=status.HTTP_404_NOT_FOUND)

    mm, created = MotxillaMaterial.objects.update_or_create(
        motxilla=motxilla,
        material=material,
        defaults={'quantitat': quantitat}
    )

    return Response({
        'msg': 'Material afegit correctament',
        'motxilla_material_id': mm.id
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([RolePermission])
def eliminar_material_motxilla(request, pk, material_pk):
    try:
        motxilla = Motxilla.objects.get(id=pk)
    except Motxilla.DoesNotExist:
        return Response({'error': 'Motxilla no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if motxilla.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        mm = MotxillaMaterial.objects.get(motxilla=motxilla, material_id=material_pk)
        mm.delete()
        return Response({'msg': 'Material eliminat correctament'}, status=status.HTTP_200_OK)
    except MotxillaMaterial.DoesNotExist:
        return Response({'error': 'Material no trobat en aquesta motxilla.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([RolePermission])
def afegir_menjar_motxilla(request, pk):
    try:
        motxilla = Motxilla.objects.get(id=pk)
    except Motxilla.DoesNotExist:
        return Response({'error': 'Motxilla no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if motxilla.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    menjar_id = request.data.get('menjar_id')
    quantitat = request.data.get('quantitat', 1)

    try:
        menjar = Menjar.objects.get(id=menjar_id)
    except Menjar.DoesNotExist:
        return Response({'error': 'Menjar no trobat.'}, status=status.HTTP_404_NOT_FOUND)

    mj, created = MotxillaMenjar.objects.update_or_create(
        motxilla=motxilla,
        menjar=menjar,
        defaults={'quantitat': quantitat}
    )

    return Response({
        'msg': 'Menjar afegit correctament',
        'motxilla_menjar_id': mj.id
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([RolePermission])
def eliminar_menjar_motxilla(request, pk, menjar_pk):
    try:
        motxilla = Motxilla.objects.get(id=pk)
    except Motxilla.DoesNotExist:
        return Response({'error': 'Motxilla no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if motxilla.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        mj = MotxillaMenjar.objects.get(motxilla=motxilla, menjar_id=menjar_pk)
        mj.delete()
        return Response({'msg': 'Menjar eliminat correctament'}, status=status.HTTP_200_OK)
    except MotxillaMenjar.DoesNotExist:
        return Response({'error': 'Menjar no trobat en aquesta motxilla.'}, status=status.HTTP_404_NOT_FOUND)


# ==========================================
# 6. PLANIFICACIÓ
# ==========================================
@api_view(['GET'])
@permission_classes([RolePermission])
def list_planificacions_usuari(request, pk):
    try:
        usuari = Usuari.objects.get(id=pk)
    except Usuari.DoesNotExist:
        return Response({'error': 'Usuari no trobat.'}, status=status.HTTP_404_NOT_FOUND)

    if usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    planificacions = Planificacio.objects.filter(usuari=usuari)
    serializer = PlanificacioSerializer(planificacions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([RolePermission])
def list_planificacions_ruta(request, pk):
    """Retorna les planificacions que l'usuari autenticat té per a una ruta concreta,
    amb el detall complet (motxilla + despeses + pressupost_total)."""
    try:
        ruta = Ruta.objects.get(id=pk)
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    planificacions = Planificacio.objects.filter(ruta=ruta, usuari=request.user)
    serializer = PlanificacioDetailSerializer(planificacions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([RolePermission])
def crear_planificacio(request):
    serializer = PlanificacioSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(usuari=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([RolePermission])
def retrieve_planificacio(request, pk):
    try:
        planificacio = Planificacio.objects.get(id=pk)
    except Planificacio.DoesNotExist:
        return Response({'error': 'Planificació no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if planificacio.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = PlanificacioDetailSerializer(planificacio)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([RolePermission])
def update_planificacio(request, pk):
    try:
        planificacio = Planificacio.objects.get(id=pk)
    except Planificacio.DoesNotExist:
        return Response({'error': 'Planificació no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if planificacio.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = PlanificacioSerializer(planificacio, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([RolePermission])
def delete_planificacio(request, pk):
    try:
        planificacio = Planificacio.objects.get(id=pk)
    except Planificacio.DoesNotExist:
        return Response({'error': 'Planificació no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if planificacio.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    planificacio.delete()
    return Response({'msg': 'Planificació eliminada correctament'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([RolePermission])
def afegir_despesa(request, pk):
    try:
        planificacio = Planificacio.objects.get(id=pk)
    except Planificacio.DoesNotExist:
        return Response({'error': 'Planificació no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if planificacio.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    despesa_data = request.data.copy()
    despesa_data['planificacio'] = pk
    serializer = PressupostDespesaSerializer(data=despesa_data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([RolePermission])
def eliminar_despesa(request, pk):
    try:
        despesa = PressupostDespesa.objects.get(id=pk)
    except PressupostDespesa.DoesNotExist:
        return Response({'error': 'Despesa no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if despesa.planificacio.usuari != request.user and request.user.rol != 'admin':
        return Response({'error': 'No tens permís.'}, status=status.HTTP_403_FORBIDDEN)

    despesa.delete()
    return Response({'msg': 'Despesa eliminada correctament'}, status=status.HTTP_200_OK)


# ==========================================
# 7. ALERTES / RISCOS
# ==========================================
@api_view(['GET'])
def list_riscos_ruta(request, pk):
    try:
        ruta = Ruta.objects.get(id=pk)
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if not ruta.track_complet or 'geometry' not in ruta.track_complet:
        return Response([], status=status.HTTP_200_OK)

    coords = ruta.track_complet.get('geometry', {}).get('coordinates', [])
    if not coords:
        return Response([], status=status.HTTP_200_OK)

    lats = [c[1] for c in coords]
    lngs = [c[0] for c in coords]
    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)
    bbox_margin = 0.05

    riscos = RiscEstatic.objects.filter(
        actiu=True,
        latitud__gte=min_lat - bbox_margin,
        latitud__lte=max_lat + bbox_margin,
        longitud__gte=min_lng - bbox_margin,
        longitud__lte=max_lng + bbox_margin
    )

    serializer = RiscEstaticSerializer(riscos, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def list_alertes_ruta(request, pk):
    try:
        ruta = Ruta.objects.get(id=pk)
    except Ruta.DoesNotExist:
        return Response({'error': 'Ruta no trobada.'}, status=status.HTTP_404_NOT_FOUND)

    if not ruta.track_complet or 'geometry' not in ruta.track_complet:
        return Response([], status=status.HTTP_200_OK)

    coords = ruta.track_complet.get('geometry', {}).get('coordinates', [])
    if not coords:
        return Response([], status=status.HTTP_200_OK)

    lats = [c[1] for c in coords]
    lngs = [c[0] for c in coords]
    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)
    bbox_margin = 0.1

    alertes = AlertaDinamica.objects.filter(
        data_fi__gte=datetime.now(),
        latitud__gte=min_lat - bbox_margin,
        latitud__lte=max_lat + bbox_margin,
        longitud__gte=min_lng - bbox_margin,
        longitud__lte=max_lng + bbox_margin
    )

    serializer = AlertaDinamicaSerializer(alertes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([RolePermission])
def crear_alerta(request):
    if request.user.rol != 'admin':
        return Response({'error': 'Només els administradors poden crear alertes.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = AlertaDinamicaSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 8. CLIMA (proxy Open-Meteo — free, no API key)
# ==========================================
@api_view(['GET'])
@permission_classes([RolePermission])
def get_clima(request):
    import datetime

    lat = request.query_params.get('lat')
    lon = request.query_params.get('lon')

    if not lat or not lon:
        return Response(
            {'error': 'Cal proporcionar lat i lon com a query parameters.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # --- Helpers ---
    def wmo_to_icon(code):
        code = int(code)
        if code == 0:                return 'clear_day'
        if code in (1, 2):           return 'partly_cloudy_day'
        if code == 3:                return 'cloud'
        if code in (45, 48):         return 'foggy'
        if 51 <= code <= 67:         return 'rainy'
        if 71 <= code <= 77:         return 'weather_snowy'
        if 80 <= code <= 82:         return 'rainy'
        if code in (85, 86):         return 'weather_snowy'
        if code in (95, 96, 99):     return 'thunderstorm'
        return 'cloud'

    def wmo_to_text(code):
        code = int(code)
        texts = {
            0: 'Cel serè', 1: 'Principalment serè', 2: 'Parcialment ennuvolat',
            3: 'Ennuvolat', 45: 'Boira', 48: 'Boira amb glaç',
            51: 'Plugim feble', 53: 'Plugim', 55: 'Plugim fort',
            61: 'Pluja feble', 63: 'Pluja', 65: 'Pluja forta',
            71: 'Neu feble', 73: 'Neu', 75: 'Neu forta', 77: 'Grànuls de neu',
            80: 'Xàfecs febles', 81: 'Xàfecs', 82: 'Xàfecs forts',
            85: 'Xàfecs de neu febles', 86: 'Xàfecs de neu',
            95: 'Tempesta', 96: 'Tempesta amb calamarsa', 99: 'Tempesta forta',
        }
        return texts.get(code, 'Desconegut')

    def degrees_to_compass(deg):
        dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
        return dirs[round(float(deg) / 45) % 8]

    def uv_label(uv):
        if uv is None: return 'N/D'
        uv = float(uv)
        if uv < 3:  return 'Baix'
        if uv < 6:  return 'Moderat'
        if uv < 8:  return 'Alt'
        if uv < 11: return 'Molt alt'
        return 'Extrem'

    import urllib.request
    import urllib.parse
    import urllib.error
    import json as _json

    params = {
        'latitude':        lat,
        'longitude':       lon,
        'current':         'temperature_2m,apparent_temperature,weather_code,'
                           'wind_speed_10m,wind_gusts_10m,wind_direction_10m,'
                           'precipitation,uv_index',
        'hourly':          'precipitation_probability',
        'daily':           'weather_code,temperature_2m_max,temperature_2m_min,'
                           'precipitation_probability_max,sunrise,sunset',
        'wind_speed_unit': 'kmh',
        'timezone':        'auto',
        'forecast_days':   '7',
    }

    url = 'https://api.open-meteo.com/v1/forecast?' + urllib.parse.urlencode(params)

    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            weather = _json.loads(resp.read().decode())
    except urllib.error.URLError as exc:
        return Response(
            {'error': f'Error consultant Open-Meteo: {str(exc.reason)}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception as exc:
        return Response(
            {'error': f'Error inesperat: {str(exc)}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    try:
        current = weather['current']
        daily   = weather['daily']
        hourly  = weather.get('hourly', {})

        # Precipitation probability for the current hour
        now_hour = current['time'][:13]  # "2026-05-22T14"
        pop_pct = 0
        for i, t in enumerate(hourly.get('time', [])):
            if t[:13] == now_hour:
                val = hourly['precipitation_probability'][i]
                pop_pct = int(val) if val is not None else 0
                break

        # Sunrise/sunset come as "2026-05-22T06:30" → take last 5 chars
        sunrise_str = daily['sunrise'][0][-5:] if daily.get('sunrise') else 'N/D'
        sunset_str  = daily['sunset'][0][-5:]  if daily.get('sunset')  else 'N/D'

        # 7-day forecast
        day_names = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']
        today = datetime.date.today()
        forecast_list = []
        for i, date_str in enumerate(daily.get('time', [])[:7]):
            entry_date = datetime.date.fromisoformat(date_str)
            dia = 'Avui' if entry_date == today else day_names[entry_date.weekday()]
            forecast_list.append({
                'dia':  dia,
                'icon': wmo_to_icon(daily['weather_code'][i]),
                'max':  round(daily['temperature_2m_max'][i]),
                'min':  round(daily['temperature_2m_min'][i]),
            })

        uv = current.get('uv_index')

        data = {
            'temperatura': round(current['temperature_2m']),
            'sensacio':    round(current['apparent_temperature']),
            'condicio':    wmo_to_text(current['weather_code']),
            'icon':        wmo_to_icon(current['weather_code']),
            'vent': {
                'velocitat': round(current.get('wind_speed_10m', 0)),
                'direccio':  degrees_to_compass(current.get('wind_direction_10m', 0)),
                'rafegues':  round(current.get('wind_gusts_10m', current.get('wind_speed_10m', 0))),
            },
            'precipitacio': pop_pct,
            'mm':           round(current.get('precipitation', 0), 1),
            'uvIndex':      round(uv) if uv is not None else None,
            'uvNivel':      uv_label(uv),
            'sortida':      sunrise_str,
            'posta':        sunset_str,
            'forecast':     forecast_list,
        }
    except Exception as exc:
        import traceback
        return Response(
            {'error': f'Error processant dades: {str(exc)}', 'detail': traceback.format_exc()},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(data, status=status.HTTP_200_OK)


# ==========================================
# 9. CHATBOT IA (OpenAI-compatible — canvia el proveïdor via variables d'entorn)
# ==========================================
_CHATBOT_SYSTEM_PROMPT = """Ets WildPlan IA, un expert en preparació d'excursions i senderisme de muntanya.
El teu objectiu és assessorar l'usuari sobre quin equipament ha de portar basant-te en les dades objectives de la seva ruta.

Instruccions OBLIGATÒRIES:
1. A CADA missatge de l'usuari, crida SEMPRE get_ruta_info per obtenir les dades actuals de la ruta.
2. Si l'usuari demana EXPLÍCITAMENT afegir un ítem (per exemple "afegeix X", "posa X a la motxilla", "necessito X"), afegeix-lo IMMEDIATAMENT amb add_item_to_planificacio. NO preguntis confirmació.
3. Si la consulta és sobre equipament general o anàlisi, afegeix de forma autònoma els ítems necessaris basant-te en els criteris.
4. MAI demanis a l'usuari el ruta_id ni el planificacio_id. Els tens al context de la sessió.
5. Informa l'usuari de cada ítem afegit i el motiu.

Estimació de valors (OBLIGATORI per a cada crida a add_item_to_planificacio):
- Proporciona SEMPRE un valor realista per a "pes" (grams) i "preu" (EUR). Mai enviïs null ni 0.
- Per a menjars, proporciona SEMPRE "calories" (kcal per unitat).
- Usa valors típics de mercat per a material de senderisme:
  * Bastó de trekking: pes=280g, preu=35€
  * Ampolla d'hidratació 1L: pes=180g, preu=12€
  * Kit primers auxilis: pes=250g, preu=18€
  * Casc d'escalada: pes=320g, preu=55€
  * Crema solar SPF50: pes=100g, preu=8€
  * Linterna frontal: pes=90g, preu=22€
  * Manta de supervivència: pes=50g, preu=5€
  * Barretes energètiques: pes=55g, preu=1.5€, calories=220
  * Menjar liofilitzat de muntanya: pes=130g, preu=7€, calories=450
  * Fruita seca (porció): pes=80g, preu=1€, calories=380
  * Gel energètic: pes=32g, preu=2€, calories=100

Criteris d'equipament (aplica quan analitzes la ruta):
- Distància > 10 km → afegeix "Ampolla d'hidratació 1L" (tipus: material, quantitat: 2)
- Desnivell positiu > 500 m → afegeix "Bastons de trekking" (tipus: material, quantitat: 1)
- Desnivell positiu > 1000 m o dificultat "dificil"/"molt_dificil"/"extrema" → afegeix "Kit primers auxilis" (tipus: material, quantitat: 1)
- Temps estimat > 5h → afegeix "Barretes energètiques" (tipus: menjar, quantitat: 3)
- Temps estimat > 8h → afegeix "Menjar liofilitzat de muntanya" (tipus: menjar, quantitat: 1)
- Modalitat "alpinisme" o "escalada" → afegeix "Casc d'escalada" (tipus: material, quantitat: 1)
- Modalitat "esqui" → afegeix "Crema solar SPF50" (tipus: material, quantitat: 1)

Respon SEMPRE en català. Sigues concís i pràctic.
Estructura: 1) Breu anàlisi de la ruta (1-2 frases) 2) Equipament afegit (llista amb motiu) 3) Recomanació final."""

_CHATBOT_DRAFT_SYSTEM_PROMPT = """Ets WildPlan IA, un expert en preparació d'excursions i senderisme de muntanya.
El teu objectiu és assessorar l'usuari sobre quin equipament ha de portar basant-te en les dades objectives de la seva ruta.

Instruccions OBLIGATÒRIES:
1. Tens les dades tècniques de la ruta directament al context. NO cal cap eina per obtenir-les.
2. Si la consulta és sobre equipament o anàlisi, crida add_item_to_draft de forma autònoma per cada ítem recomanat.
3. Si l'usuari demana EXPLÍCITAMENT afegir un ítem, afegeix-lo IMMEDIATAMENT amb add_item_to_draft.
4. MAI demanis dades que ja tens al context (distància, desnivell, nodes...).
5. Informa l'usuari de cada ítem afegit a l'esborrany i el motiu.

Estimació de valors (OBLIGATORI per a cada crida a add_item_to_draft):
- Proporciona SEMPRE un valor realista per a "pes" (grams) i "preu" (EUR). Mai enviïs null ni 0.
- Per a menjars, proporciona SEMPRE "calories" (kcal per unitat).
- Usa valors típics de mercat per a material de senderisme:
  * Bastó de trekking: pes=280g, preu=35€
  * Ampolla d'hidratació 1L: pes=180g, preu=12€
  * Kit primers auxilis: pes=250g, preu=18€
  * Casc d'escalada: pes=320g, preu=55€
  * Crema solar SPF50: pes=100g, preu=8€
  * Linterna frontal: pes=90g, preu=22€
  * Manta de supervivència: pes=50g, preu=5€
  * Barretes energètiques: pes=55g, preu=1.5€, calories=220
  * Menjar liofilitzat de muntanya: pes=130g, preu=7€, calories=450
  * Fruita seca (porció): pes=80g, preu=1€, calories=380
  * Gel energètic: pes=32g, preu=2€, calories=100

Criteris d'equipament (aplica quan analitzes la ruta):
- Distància > 10 km → afegeix "Ampolla d'hidratació 1L" (tipus: material, quantitat: 2)
- Desnivell positiu > 500 m → afegeix "Bastons de trekking" (tipus: material, quantitat: 1)
- Desnivell positiu > 1000 m → afegeix "Kit primers auxilis" (tipus: material, quantitat: 1)
- Temps estimat > 5h → afegeix "Barretes energètiques" (tipus: menjar, quantitat: 3)
- Modalitat "alpinisme" o "escalada" → afegeix "Casc d'escalada" (tipus: material, quantitat: 1)
- Modalitat "esqui" → afegeix "Crema solar SPF50" (tipus: material, quantitat: 1)

Respon SEMPRE en català. Sigues concís i pràctic.
Estructura: 1) Breu anàlisi de la ruta 2) Equipament afegit a l'esborrany (llista amb motiu) 3) Recomanació final."""


@api_view(['POST'])
@permission_classes([RolePermission])
def claude_chatbot(request):
    import json as _json
    from openai import OpenAI
    from .ia_tools import get_ruta_info, add_item_to_planificacio, TOOLS, DRAFT_TOOLS

    

    ruta_id = request.data.get('ruta_id')
    planificacio_id = request.data.get('planificacio_id')
    draft_context = request.data.get('draft_context')
    missatge = request.data.get('missatge', '').strip()

    is_draft = not ruta_id and draft_context is not None

    if not missatge:
        return Response(
            {'error': "Cal proporcionar missatge."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not is_draft:
        if not ruta_id or not planificacio_id:
            return Response(
                {'error': "Cal proporcionar ruta_id, planificacio_id i missatge."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            Planificacio.objects.get(id=planificacio_id, usuari=request.user)
        except Planificacio.DoesNotExist:
            return Response(
                {'error': "Planificació no trobada o sense permís."},
                status=status.HTTP_404_NOT_FOUND,
            )

    api_key = os.environ.get("GITHUB_TOKEN", "")
    base_url = os.environ.get("AI_BASE_URL", "https://api.openai.com/v1")
    model = os.environ.get("AI_MODEL", "gpt-4o-mini")

    if not api_key:
        return Response(
            {'error': "Falta configurar AI_API_KEY al backend."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    client = OpenAI(api_key=api_key, base_url=base_url)

    if is_draft:
        context_str = _json.dumps(draft_context, ensure_ascii=False, indent=2)
        system_prompt = (
            _CHATBOT_DRAFT_SYSTEM_PROMPT
            + f"\n\nDades de la ruta (esborrany):\n{context_str}"
        )
        active_tools = DRAFT_TOOLS
    else:
        system_prompt = (
            _CHATBOT_SYSTEM_PROMPT
            + f"\n\nContexte actual de la sessió:\n- ruta_id: {ruta_id}\n- planificacio_id: {planificacio_id}\n"
            "Usa sempre aquests IDs quan cridis les eines. NO demanis a l'usuari que els proporcioni."
        )
        active_tools = TOOLS

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": missatge},
    ]
    inventari_actualitzat = False
    draft_items = []
    text_final = ""

    try:
        while True:
            call_kwargs = dict(model=model, max_tokens=2048, messages=messages)
            if active_tools:
                call_kwargs["tools"] = active_tools
                call_kwargs["tool_choice"] = "auto"
            response = client.chat.completions.create(**call_kwargs)
            choice = response.choices[0]

            if choice.finish_reason == "stop":
                text_final = choice.message.content or "No he pogut generar una resposta."
                break

            if choice.finish_reason == "tool_calls":
                messages.append(choice.message)

                for tc in choice.message.tool_calls:
                    args = _json.loads(tc.function.arguments)
                    name = tc.function.name

                    if name == "get_ruta_info":
                        result = get_ruta_info(args["ruta_id"])
                    elif name == "add_item_to_planificacio":
                        result = add_item_to_planificacio(
                            planificacio_id=args["planificacio_id"],
                            nom=args["nom"],
                            tipus=args["tipus"],
                            quantitat=args.get("quantitat", 1),
                            pes=args.get("pes"),
                        )
                        if result.get("ok"):
                            inventari_actualitzat = True
                    elif name == "add_item_to_draft":
                        item = {
                            "nom": args["nom"],
                            "tipus": args["tipus"],
                            "quantitat": args.get("quantitat", 1),
                            "pes": args.get("pes", 0),
                            "preu": args.get("preu", 0),
                            "calories": args.get("calories", 0),
                        }
                        draft_items.append(item)
                        result = {"ok": True, "nom": item["nom"], "tipus": item["tipus"], "quantitat": item["quantitat"]}
                    else:
                        result = {"error": f"Eina desconeguda: {name}"}

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": _json.dumps(result, ensure_ascii=False),
                    })
            else:
                break

    except Exception as e:
        return Response(
            {'error': f"Error de l'IA: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({
        "resposta": text_final,
        "inventari_actualitzat": inventari_actualitzat,
        "draft_items": draft_items,
    }, status=status.HTTP_200_OK)