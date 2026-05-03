from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import ImageField


# ==========================================
# 1. USUARI PERSONALITZAT
# ==========================================
class Usuari(models.Model):
    ROLS = [
        ('freemium', 'Freemium'),
        ('premium', 'Premium'),
        ('admin', 'Administrador')
    ]

    descripcio = models.TextField(blank=True, null=True)
    username = models.CharField(max_length=150, unique=True) # Nom d'usuari únic
    email = models.EmailField(unique=True) # Correu electrònic únic per usuari
    data_naixement = models.DateField(null=True, blank=True) # Opcional
    biografia = models.TextField(null=True, blank=True) # Text llarg per la bio
    rol = models.CharField(max_length=10, choices=ROLS, default='freemium') # rol d'usuari
    url_foto_perfil = models.URLField(null=True, blank=True) # Enllaç a la imatge de perfil
    password = models.CharField(max_length=128) # password

    def __str__(self):
        return f"{self.username} ({self.rol})"

# ==========================================
# 2. RUTA I GEOMETRIA (ESTIL KOMOOT)
# ==========================================
class Ruta(models.Model):
    MODALITATS = [
        ('senderisme', 'Senderisme'),
        ('alpinisme', 'Alpinisme'),
        ('btt', 'Bicicleta BTT'),
        ('trail_running', 'Trail Running')
    ]
    nom = models.CharField(max_length=150)
    descripcio = models.TextField(blank=True, null=True)
    modalitat = models.CharField(max_length=50, choices=MODALITATS, null=True, blank=True)

    usuari = models.ForeignKey(
        'Usuari',
        on_delete=models.SET_NULL,
        null=True,
        related_name='rutes_creades'
    )

    # Fotos simplificades en la mateixa taula
    imatge_portada = models.URLField(max_length=255, blank=True, null=True)
    galeria_fotos = models.JSONField(default=list, blank=True, help_text="Llista d'URLs de fotos")
    es_verificada = models.BooleanField(default=False)
    distancia = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, help_text="En km")
    desnivell_positiu = models.IntegerField(null=True, blank=True, help_text="En metres")
    temps_estimat = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="En hores")
    mapa_gps = models.JSONField(null=True, blank=True, help_text="Track complet opcional")
    data_creacio = models.DateField(auto_now_add=True) # S'assigna la data actual automàticament


    def __str__(self):
        return self.nom

class ItinerariNode(models.Model):
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='nodes')
    ordre = models.IntegerField()
    latitud = models.DecimalField(max_digits=10, decimal_places=8)
    longitud = models.DecimalField(max_digits=11, decimal_places=8)
    altitud = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    es_waypoint = models.BooleanField(default=True)
    nom_punt = models.CharField(max_length=150, blank=True, null=True)

    class Meta:
        ordering = ['ordre']

    def __str__(self):
        return f"{self.ruta.nom} - Node {self.ordre} ({self.nom_punt or 'Punt'})"

class Tram(models.Model):
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='trams')
    node_origen = models.ForeignKey(ItinerariNode, on_delete=models.CASCADE, related_name='trams_sortida')
    node_desti = models.ForeignKey(ItinerariNode, on_delete=models.CASCADE, related_name='trams_arribada')

    geometria_segment = models.JSONField(null=True, blank=True, help_text="Track calculat per ORS per a aquest segment")
    distancia_metres = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    desnivell_positiu = models.IntegerField(null=True, blank=True)
    temps_estimat_minuts = models.IntegerField(null=True, blank=True)

class Servei(models.Model):
    TIPUS_SERVEI = [
        ('aigua', 'Font / Punt d\'aigua'),
        ('refugi', 'Refugi / Hostal'),
        ('restauracio', 'Restaurant / Bar'),
        ('parking', 'Aparcament'),
        ('salut', 'Punt d\'emergència / SOS'),
        ('electricitat', 'Càrrega elèctrica'),
    ]

    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='serveis')
    node = models.ForeignKey(ItinerariNode, on_delete=models.SET_NULL, null=True, blank=True, related_name='serveis_node')
    tipus = models.CharField(max_length=50, choices=TIPUS_SERVEI) # Ex: 'font', 'refugi', 'botiga'
    nom = models.CharField(max_length=150)
    descripcio = models.TextField(blank=True, null=True)
    te_cost = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.nom} ({self.tipus})"

# ==========================================
# 3. INTERACCIÓ SOCIAL
# ==========================================
class Valoracio(models.Model):
    usuari = models.ForeignKey(Usuari, on_delete=models.CASCADE)
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='puntuacions')
    puntuacio = models.IntegerField()  # La nota de l'1 al 5
    like = models.BooleanField()
    data_valoracio = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('usuari', 'ruta')

    def __str__(self):
        return f"{self.puntuacio} estrelles de {self.usuari.username} a {self.ruta.nom}"

class Comentari(models.Model):
    usuari = models.ForeignKey(Usuari, on_delete=models.CASCADE)
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='comentaris')

    # RELACIÓ CLAU: Enllacem el comentari amb la seva valoració
    # Fem servir OneToOneField perquè un comentari només té una valoració associada
    valoracio_rel = models.OneToOneField(
        Valoracio,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='comentari_text'
    )

    descripcio = models.TextField()
    data_creacio = models.DateTimeField(auto_now_add=True)

# ==========================================
# 4. LOGÍSTICA (INDEPENDENT)
# ==========================================
class Material(models.Model):
    nom = models.CharField(max_length=100)
    descripcio = models.TextField(blank=True, null=True)
    pes = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, help_text="Grams")
    volum = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Litres")
    preu = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    imatge_url = models.URLField(max_length=255, blank=True, null=True)
    link_compra = models.URLField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.nom

class Menjar(models.Model):
    nom = models.CharField(max_length=100)
    descripcio = models.TextField(blank=True, null=True)
    pes = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, help_text="En grams per ració")
    volum = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Litres")
    preu = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    calories = models.IntegerField(null=True, blank=True, help_text="Vital per a la IA")
    imatge_url = models.URLField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.nom

class Motxilla(models.Model):
    usuari = models.ForeignKey(Usuari, on_delete=models.CASCADE, related_name='motxilles')
    nom = models.CharField(max_length=150)
    pes_base = models.DecimalField(max_digits=7, decimal_places=2, default=0)

    # Relacions ManyToMany passant per taules intermèdies
    materials = models.ManyToManyField(Material, through='MotxillaMaterial')
    menjars = models.ManyToManyField(Menjar, through='MotxillaMenjar')

    def __str__(self):
        return self.nom

class MotxillaMaterial(models.Model):
    motxilla = models.ForeignKey(Motxilla, on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantitat = models.IntegerField(default=1)

class MotxillaMenjar(models.Model):
    motxilla = models.ForeignKey(Motxilla, on_delete=models.CASCADE)
    menjar = models.ForeignKey(Menjar, on_delete=models.CASCADE)
    quantitat = models.IntegerField(default=1)

# ==========================================
# 5. PLANIFICACIÓ (EL CASAMENT)
# ==========================================
class Planificacio(models.Model):
    usuari = models.ForeignKey(Usuari, on_delete=models.CASCADE, related_name='planificacions')
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='planificacions')
    motxilla = models.ForeignKey(Motxilla, on_delete=models.SET_NULL, null=True, blank=True)
    titol = models.CharField(max_length=150)
    data_inici = models.DateField(null=True, blank=True)
    data_fi = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.titol} ({self.usuari.username})"

class PressupostDespesa(models.Model):
    planificacio = models.ForeignKey(Planificacio, on_delete=models.CASCADE, related_name='despeses')
    concepte = models.CharField(max_length=100)
    import_despesa = models.DecimalField(max_digits=7, decimal_places=2)
    divisa = models.CharField(max_length=10, default='EUR')

# ==========================================
# 6. CHATBOT IA I ALERTES
# ==========================================
class RiscEstatic(models.Model):
    nom = models.CharField(max_length=150)
    tipus = models.CharField(max_length=50) # 'tartera', 'cresta', 'pas_equipat'
    nivell_perill = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    descripcio = models.TextField(blank=True, null=True)
    latitud = models.DecimalField(max_digits=10, decimal_places=8)
    longitud = models.DecimalField(max_digits=11, decimal_places=8)
    radi_afectacio = models.IntegerField(default=50, help_text="Metres")
    origen_dades = models.CharField(max_length=50, default='manual')
    actiu = models.BooleanField(default=True)
    data_creacio = models.DateTimeField(auto_now_add=True)

class AlertaDinamica(models.Model):
    titol = models.CharField(max_length=150)
    tipus = models.CharField(max_length=50) # 'meteo', 'allau', 'tall_camins'
    nivell_perill = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    descripcio = models.TextField(blank=True, null=True)
    latitud = models.DecimalField(max_digits=10, decimal_places=8)
    longitud = models.DecimalField(max_digits=11, decimal_places=8)
    radi_afectacio = models.IntegerField(default=5000, help_text="Metres")
    data_inici = models.DateTimeField()
    data_fi = models.DateTimeField()
    origen_dades = models.CharField(max_length=50, blank=True, null=True)
    url_font_oficial = models.URLField(max_length=255, blank=True, null=True)
    data_creacio = models.DateTimeField(auto_now_add=True)



### JWT AUTHENTICATION
class TokenJWT2(models.Model):
    user = models.ForeignKey(Usuari, on_delete=models.CASCADE)
    token = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Security token for: {self.user.username}"