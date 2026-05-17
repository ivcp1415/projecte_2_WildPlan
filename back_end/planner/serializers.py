# /back/api/serializers.py
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import (
    Usuari, Ruta, ItinerariNode, Tram, Servei, 
    Comentari, Valoracio, Material, Menjar, Motxilla, 
    MotxillaMaterial, MotxillaMenjar, Planificacio, 
    PressupostDespesa, RiscEstatic, AlertaDinamica
)

# ==========================================
# 1. USUARI I AUTENTICACIÓ
# ==========================================
class UsuariSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuari
        fields = '__all__' 
        extra_kwargs = {
            'password': {'write_only': True} 
        }

class UsuariUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuari
        fields = ['username', 'email', 'data_naixement', 'biografia', 'url_foto_perfil']
        extra_kwargs = {
            'data_naixement':  {'required': False, 'allow_null': True},
            'biografia':       {'required': False, 'allow_blank': True},
            'url_foto_perfil': {'required': False, 'allow_null': True},
        }

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class RegistreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuari
        fields = ['username', 'email', 'password', 'data_naixement',
                  'biografia', 'url_foto_perfil']

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

# ==========================================
# 2. RUTA I GEOMETRIA
# ==========================================
class RutaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ruta
        fields = '__all__'
        read_only_fields = ['usuari'] # L'usuari s'ha d'assignar automàticament des del request, no via JSON

class ItinerariNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItinerariNode
        fields = '__all__'

class TramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tram
        fields = '__all__'

class ServeiSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servei
        fields = '__all__'

# ==========================================
# 3. INTERACCIÓ SOCIAL
# ==========================================
class ValoracioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Valoracio
        fields = '__all__'
        read_only_fields = ['usuari']

class ComentariSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comentari
        fields = '__all__'
        read_only_fields = ['usuari']

# ==========================================
# 4. LOGÍSTICA
# ==========================================
class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'

class MenjarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Menjar
        fields = '__all__'

class MotxillaMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotxillaMaterial
        fields = '__all__'

class MotxillaMenjarSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotxillaMenjar
        fields = '__all__'

class MotxillaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Motxilla
        fields = '__all__'
        read_only_fields = ['usuari']

# ==========================================
# 5. PLANIFICACIÓ
# ==========================================
class PlanificacioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planificacio
        fields = '__all__'
        read_only_fields = ['usuari']

class PressupostDespesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PressupostDespesa
        fields = '__all__'

# ==========================================
# 6. ALERTES I IA
# ==========================================
class RiscEstaticSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiscEstatic
        fields = '__all__'

class AlertaDinamicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertaDinamica
        fields = '__all__'