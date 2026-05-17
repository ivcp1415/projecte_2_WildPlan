# back_end/api/permissions.py

import jwt
from django.conf import settings
from rest_framework.permissions import BasePermission
from .models import Usuari  # Assegura't que l'aplicació es diu correctament

class RolePermission(BasePermission):
    """
    Permisos generals a nivell d'endpoint segons el rol de l'usuari.
    Integra la lectura manual del JWT.
    """

    def has_permission(self, request, view):
        # 1. LECTURA MANUAL DEL JWT (Capçalera Authorization)
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]  # Separem la paraula 'Bearer'
            try:
                # Decodifiquem el token amb la clau secreta del projecte
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])

                # Busquem l'usuari pel username que ve al payload
                user = Usuari.objects.get(username=payload['username'])

                # Assignem l'usuari a la petició perquè estigui disponible a tot arreu
                request.user = user

            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Usuari.DoesNotExist):
                # Si el token no és vàlid, ho deixem passar; serà tractat com a usuari anònim
                pass

        # 2. LÒGICA DE ROLS I PERMISOS GLOBALS
        # Si no tenim usuari reconegut, només pot llegir (GET, OPTIONS, HEAD)
        if getattr(request, 'user', None) is None or not hasattr(request.user, 'rol'):
            return request.method in ['GET', 'HEAD', 'OPTIONS']

        # Administrador: Accés total a qualsevol mètode (CRUD complet)
        if request.user.rol == 'admin':
            return True

        # Usuari Premium: Pot llegir, crear, modificar i esborrar
        # (La seguretat de no esborrar coses d'altres es controla a IsOwnerOrReadOnly)
        if request.user.rol == 'usuari':
            return True

        # Freemium: Accés més limitat (ex: només llegir i crear, però no modificar)
        if request.user.rol == 'freemium':
            return request.method in ['GET', 'HEAD', 'OPTIONS', 'POST']

        return False


class IsOwnerOrReadOnly(BasePermission):
    """
    Permís a nivell d'objecte: 
    Permet que tothom pugui veure l'element, però només el CREADOR el pot editar o esborrar.
    Això és vital per a models com Ruta, Comentari, Valoracio, etc.
    """

    def has_object_permission(self, request, view, obj):
        # Mètodes segurs de només lectura sempre estan permesos per a tothom
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
            
        # Els administradors tenen permís per modificar o esborrar l'objecte de qualsevol
        if hasattr(request.user, 'rol') and request.user.rol == 'admin':
            return True

        # Per a la resta, l'usuari que fa la petició ha de ser el propietari de l'objecte.
        # Això assumeix que els teus models tenen un camp 'usuari' (com Ruta, Comentari, Motxilla...)
        return obj.usuari == request.user