# /back/api/serializers.py
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import Usuari, Ruta, ItinerariNode, Tram, Comentari, Valoracio, Servei, Material, Menjar, MotxillaMaterial, \
    MotxillaMenjar, Motxilla, PressupostDespesa, Planificacio, RiscEstatic, AlertaDinamica


class UsuariSerializer(serializers.ModelSerializer):
    # Converteix les dades del model Usuari a JSON per al Login/Perfil
    class Meta:
        model = Usuari
        fields = '__all__' # Exposem tots els camps (id, username, email, etc.)

class LoginSerializer(serializers.Serializer):
    # serializer del login
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class RegistreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuari
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True},
            'biografia': {'required': False, 'allow_blank': True},
            'rol': {'read_only': True}
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class ItinerariNodeSerializer(serializers.ModelSerializer):
    # Serialitza els punts geogràfics individuals d'una ruta
    class Meta:
        model = ItinerariNode
        fields = '__all__'

class RutaSerializer(serializers.ModelSerializer):
    # Serialitzador per a les rutes.
    # Opcionalment podem incloure els nodes niats si volem veure el camí sencer d'un cop.
    class Meta:
        model = Ruta
        fields = '__all__'

class TramSerializer(serializers.ModelSerializer):
    # Gestiona la connexió entre dos nodes d'una ruta
    class Meta:
        model = Tram
        fields = '__all__'

class ServeiSerializer(serializers.ModelSerializer):
    # Retorna el nom llegible ('Refugi / Hostal') en comptes del codi ('refugi')
    tipus_display = serializers.CharField(source='get_tipus_display', read_only=True)

    class Meta:
        model = Servei
        fields = '__all__'

class ComentariSerializer(serializers.ModelSerializer):
    # Dades extres per facilitar la feina al Front-end
    nom_usuari = serializers.CharField(source='usuari.username', read_only=True)
    foto_usuari = serializers.URLField(source='usuari.url_foto_perfil', read_only=True)
    puntuacio = serializers.IntegerField(source='valoracio_rel.puntuacio', read_only=True)

    class Meta:
        model = Comentari
        fields = ['id', 'usuari', 'nom_usuari', 'foto_usuari', 'ruta', 'descripcio', 'puntuacio', 'data_creacio']
        read_only_fields = ['id', 'data_creacio']

class ValoracioSerializer(serializers.ModelSerializer):
    # Gestiona el sistema de likes/dislikes (unique_together usuari/ruta)
    class Meta:
        model = Valoracio
        fields = '__all__'

# ==========================================
# 5. LOGÍSTICA (MOTXILLA I MATERIALS)
# ==========================================
class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'

class MenjarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Menjar
        fields = '__all__'

# Serializers intermedis per mostrar la quantitat i el detall de l'ítem a la motxilla
class MotxillaMaterialSerializer(serializers.ModelSerializer):
    material_detall = MaterialSerializer(source='material', read_only=True)

    class Meta:
        model = MotxillaMaterial
        fields = ['id', 'material', 'material_detall', 'quantitat']

class MotxillaMenjarSerializer(serializers.ModelSerializer):
    menjar_detall = MenjarSerializer(source='menjar', read_only=True)

    class Meta:
        model = MotxillaMenjar
        fields = ['id', 'menjar', 'menjar_detall', 'quantitat']

class MotxillaSerializer(serializers.ModelSerializer):
    # Niuem els elements perquè el Front-end pugui llistar el contingut de la motxilla
    contingut_material = MotxillaMaterialSerializer(source='motxillamaterial_set', many=True, read_only=True)
    contingut_menjar = MotxillaMenjarSerializer(source='motxillamenjar_set', many=True, read_only=True)
    pes_total_calculat = serializers.SerializerMethodField()

    class Meta:
        model = Motxilla
        fields = ['id', 'usuari', 'nom', 'pes_base', 'contingut_material', 'contingut_menjar', 'pes_total_calculat']

    def get_pes_total_calculat(self, obj):
        # La IA i el Front-end necessiten saber el pes total: Pes Base + (Pes Materials * Quantitat) + (Pes Menjars * Quantitat)
        pes_mat = sum((item.material.pes or 0) * item.quantitat for item in obj.motxillamaterial_set.all())
        pes_men = sum((item.menjar.pes or 0) * item.quantitat for item in obj.motxillamenjar_set.all())
        return float(obj.pes_base) + float(pes_mat) + float(pes_men)

# ==========================================
# 6. PLANIFICACIÓ I DESPESES
# ==========================================
class PressupostDespesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PressupostDespesa
        fields = '__all__'

class PlanificacioSerializer(serializers.ModelSerializer):
    despeses = PressupostDespesaSerializer(many=True, read_only=True)
    nom_ruta = serializers.CharField(source='ruta.nom', read_only=True)

    class Meta:
        model = Planificacio
        fields = ['id', 'usuari', 'ruta', 'nom_ruta', 'motxilla', 'titol', 'data_inici', 'data_fi', 'despeses']


# ==========================================
# 7. CHATBOT IA I ALERTES
# ==========================================
class RiscEstaticSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiscEstatic
        fields = '__all__'

class AlertaDinamicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertaDinamica
        fields = '__all__'