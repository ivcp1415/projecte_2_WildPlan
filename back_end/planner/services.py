# back_end/rutes/services.py

import jwt
import datetime
from django.conf import settings
from django.contrib.auth.hashers import check_password

from .models import Usuari

def generate_token(user):
    """
    Genera un token JWT vàlid per a l'usuari.
    Ara inclou el 'rol' dins del payload perquè el frontend el pugui llegir directament.
    """
    payload = {
        'user_id': user.id,
        'username': user.username,
        'rol': user.rol,  # <-- Afegit per compatibilitat amb el nou model
        # He augmentat l'expiració a 24h (molt més pràctic, sobretot en desenvolupament)
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        'iat': datetime.datetime.utcnow()
    }
    
    # jwt.encode ja retorna un string en les versions recents de PyJWT
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def authenticate_user(username, pswd):
    """
    Comprova si l'usuari existeix a la base de dades i si la contrasenya fa match.
    """
    try:
        user = Usuari.objects.get(username=username)
        if validate_password(pswd, user.password):
            return user
    except Usuari.DoesNotExist:
        # Si no existeix, retornem None silenciosament per no donar pistes a possibles atacants
        pass
    
    return None

def validate_password(pswd, hashed_pswd):
    """
    Fa servir check_password de Django per comparar la contrasenya en text pla
    (la que introdueix l'usuari al fer login) amb el hash guardat a la base de dades.
    """
    try:
        return check_password(pswd, hashed_pswd)
    except Exception as e:
        print(f"Error en la verificació del password: {e}")
        return False