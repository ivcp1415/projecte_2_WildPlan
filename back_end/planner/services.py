import datetime
import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password

from dsaw_projecte_rutes.back_end.rutes.models import Usuari


def generate_token(user):
    """
    This function generates a token for a user.
    First: extract payload, set token properties.
    Then encode a send back.
    :param user:
    :return:
    """
    payload = {
        'user_id': user.id,
        'username': user.username,
        'exp': datetime.utcnow() + datetime.timedelta(hours=1),
        'iat': datetime.utcnow()
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def authenticate_user(username, pswd):
    """
    This functions validates login against bd info.
        -> if method is post, save username and execute a query to db
        -> if username exists validate password.
        -> if password matches, return view, according to rol
    :return:
    """
    try:
        user = Usuari.objects.get(username=username)

        if validate_password(pswd, user.password):
            return user
    except Usuari.DoesNotExist:
        pass
    return None

def validate_password(pswd, hashed_pswd):
    """
    Uses Django check_password for hashed password validation
    :param pswd:
    :param hashed_pswd:
    :return:
    """
    try:
        return check_password(pswd, hashed_pswd)
    except Exception as e:
        print(f"Error during password verification: {e}")
        return False