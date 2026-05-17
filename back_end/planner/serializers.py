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
    username = serializers.SerializerMethodField()
    like = serializers.SerializerMethodField()
    puntuacio = serializers.SerializerMethodField()

    class Meta:
        model = Comentari
        fields = '__all__'
        read_only_fields = ['usuari']

    def get_username(self, obj):
        return obj.usuari.username if obj.usuari else None

    def get_like(self, obj):
        return obj.valoracio_rel.like if obj.valoracio_rel else None

    def get_puntuacio(self, obj):
        return obj.valoracio_rel.puntuacio if obj.valoracio_rel else None

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

# ==========================================
# ENRICHED SERIALIZERS (DETAIL VIEWS)
# ==========================================
class MotxillaMaterialDetailSerializer(serializers.Serializer):
    material_id = serializers.SerializerMethodField()
    nom = serializers.SerializerMethodField()
    pes = serializers.SerializerMethodField()
    quantitat = serializers.IntegerField()
    pes_total = serializers.SerializerMethodField()

    def get_material_id(self, obj):
        return obj.material.id

    def get_nom(self, obj):
        return obj.material.nom

    def get_pes(self, obj):
        return obj.material.pes

    def get_pes_total(self, obj):
        pes = obj.material.pes or 0
        return float(pes) * obj.quantitat

class MotxillaMenjarDetailSerializer(serializers.Serializer):
    menjar_id = serializers.SerializerMethodField()
    nom = serializers.SerializerMethodField()
    calories = serializers.SerializerMethodField()
    pes = serializers.SerializerMethodField()
    quantitat = serializers.IntegerField()
    calories_total = serializers.SerializerMethodField()

    def get_menjar_id(self, obj):
        return obj.menjar.id

    def get_nom(self, obj):
        return obj.menjar.nom

    def get_calories(self, obj):
        return obj.menjar.calories

    def get_pes(self, obj):
        return obj.menjar.pes

    def get_calories_total(self, obj):
        calories = obj.menjar.calories or 0
        return int(calories) * obj.quantitat

class MotxillaDetailSerializer(serializers.ModelSerializer):
    materials_detall = serializers.SerializerMethodField()
    menjars_detall = serializers.SerializerMethodField()
    pes_total_grams = serializers.SerializerMethodField()
    calories_totals = serializers.SerializerMethodField()

    class Meta:
        model = Motxilla
        fields = '__all__'
        read_only_fields = ['usuari']

    def get_materials_detall(self, obj):
        materials = obj.motxillamaterial_set.all()
        return MotxillaMaterialDetailSerializer(materials, many=True).data

    def get_menjars_detall(self, obj):
        menjars = obj.motxillamenjar_set.all()
        return MotxillaMenjarDetailSerializer(menjars, many=True).data

    def get_pes_total_grams(self, obj):
        pes_base = float(obj.pes_base or 0)
        pes_materials = sum(
            float(mm.material.pes or 0) * mm.quantitat
            for mm in obj.motxillamaterial_set.all()
        )
        pes_menjars = sum(
            float(mj.menjar.pes or 0) * mj.quantitat
            for mj in obj.motxillamenjar_set.all()
        )
        return pes_base + pes_materials + pes_menjars

    def get_calories_totals(self, obj):
        return sum(
            (mj.menjar.calories or 0) * mj.quantitat
            for mj in obj.motxillamenjar_set.all()
        )

class RutaMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ruta
        fields = ['id', 'nom', 'distancia', 'desnivell_positiu', 'temps_estimat', 'modalitat']

class PlanificacioDetailSerializer(serializers.ModelSerializer):
    ruta = RutaMiniSerializer(read_only=True)
    motxilla = MotxillaDetailSerializer(read_only=True, allow_null=True)
    despeses = PressupostDespesaSerializer(many=True, read_only=True, source='despeses')
    pressupost_total = serializers.SerializerMethodField()

    class Meta:
        model = Planificacio
        fields = '__all__'
        read_only_fields = ['usuari']

    def get_pressupost_total(self, obj):
        return sum(float(d.import_despesa or 0) for d in obj.despeses.all())