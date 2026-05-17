from django.urls import path
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import views
from .models import TokenJWT2
from .serializers import LoginSerializer, RegistreSerializer
from .services import authenticate_user, generate_token


# Create your views here.
# Create your views here.
@api_view(['POST'])
def login_view(request):
    """
    Login per validar credencials d'usuari. Rep usuari i contrasenya
    :param request:
    :return:
    """
    serializer = LoginSerializer(data=request.data) # receive data from payload
    if serializer.is_valid():
        # extract validated data
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        # verify credentials
        user = authenticate_user(username, password)

        # generate token
        if user:
            token = generate_token(user)
            TokenJWT2.objects.create(user=user, token=token)
            return Response({'token': token, 'username': user.username}, status=status.HTTP_200_OK)

        return Response({'error': 'Authentication failed'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) # validation errors

# Create your views here.
@api_view(['POST'])
def register(request):
    # paso los datos del usuario al serializer para validarlas
    serializer = RegistreSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {'missatge': 'Usuari creat correctament.'},
            status=201
        )
    return Response(serializer.errors, status=400)


# /back/api/views.py

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Ruta
from .serializers import RutaSerializer, RutaDetallSerializer  # Necessitarem dos serializers


# ==========================================
# 1. LLISTAT DE RUTES (SIMPLE)
# ==========================================
@api_view(['GET'])
def llistat_rutes(request):
    """
    Retorna totes les rutes amb informació bàsica.
    Ideal per a la "Pàgina Principal" o llistat de rutes.
    Compleix WSG: No envia dades innecessàries (com els trams).
    """
    try:
        # Obtenim totes les rutes de la BD
        rutes = Ruta.objects.all()

        # Utilitzem el serializer bàsic (sense trams)
        serializer = RutaSerializer(rutes, many=True)

        # Retornem la resposta 200 OK
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# 2. DETALL D'UNA RUTA (AMB TRAMS)
# ==========================================
@api_view(['GET'])
def detall_ruta(request, pk):
    """
    Retorna la informació completa d'una ruta específica a partir de la seva ID (pk).
    Aquí Sí que incloem els trams perquè l'usuari ha demanat veure el detall.
    """
    try:
        # Intentem buscar la ruta per la seva ID única
        try:
            ruta = Ruta.objects.get(pk=pk)
        except Ruta.DoesNotExist:
            return Response({'error': 'Ruta no trobada'}, status=status.HTTP_404_NOT_FOUND)

        # Utilitzem un serializer específic que inclogui els trams niats
        serializer = RutaDetallSerializer(ruta)

        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)