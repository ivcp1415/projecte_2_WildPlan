from django.urls import path
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import views
from .models import TokenJWT2
from .serializers import LoginSerializer
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

