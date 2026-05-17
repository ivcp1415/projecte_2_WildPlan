from django.db import models
from django.contrib.auth.models import AbstractUser

# ==========================================
# 1. USUARI PERSONALITZAT
# ==========================================
class Usuari(models.Model):
    ROLS = [
        ('usuari', 'Usuari'),
        ('freemium', 'Freemium'),
        ('admin', 'Administrador')
    ]

    username = models.CharField(max_length=150, unique=True) # Nom d'usuari únic
    email = models.EmailField(unique=True) # Correu electrònic únic per usuari
    password = models.CharField(max_length=128) # Password

    descripcio = models.TextField(blank=True, null=True)
    data_naixement = models.DateField(null=True, blank=True) # Opcional
    biografia = models.TextField(null=True, blank=True) # Text llarg per la bio
    url_foto_perfil = models.URLField(null=True, blank=True) # Enllaç a la imatge de perfil
    
    rol = models.CharField(max_length=15, choices=ROLS, default='usuari') # Rol d'usuari

    def __str__(self):
        return self.username

# ==========================================
# 2. RUTA I GEOMETRIA (ESTIL KOMOOT)
# ==========================================
class Ruta(models.Model):
    MODALITATS = [
        ('senderisme', 'Senderisme'),
        ('alpinisme', 'Alpinisme'),
        ('btt', 'Bicicleta BTT'),
        ('trail_running', 'Trail Running'),
        ('escalada', 'Escalada'),
        ('esqui', 'Esquí'),
        ('altra', 'Altra'),
    ]

    DIFICULTATS = [
        ('facil', 'Fàcil - Per a tots els públics'),
        ('moderada', 'Moderada - Requereix certa forma física'),
        ('dificil', 'Difícil - Desnivell o terreny exigent'),
        ('molt_dificil', 'Molt difícil - Només per a experts'),
        ('extrema', 'Extrema - Risc elevat o equipament especial'),
    ]

    dificultat = models.CharField(
        max_length=20, 
        choices=DIFICULTATS, 
        default='moderada',
        help_text="Nivell general de dificultat de la ruta"
    )
    
    nom = models.CharField(max_length=200)
    descripcio = models.TextField(blank=True, null=True)
    modalitat = models.CharField(max_length=50, choices=MODALITATS, default='senderisme')

    usuari = models.ForeignKey(
        Usuari,
        on_delete=models.CASCADE,
        related_name='rutes_creades'
    )

    # Imatges
    imatge_portada = models.URLField(max_length=255, blank=True, null=True)
    galeria_fotos = models.JSONField(default=list, blank=True, help_text="Llista d'URLs de fotos")
    
    # Dades tècniques
    es_verificada = models.BooleanField(default=False)
    distancia = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="En km")
    desnivell_positiu = models.IntegerField(default=0, help_text="En metres")
    desnivell_negatiu = models.IntegerField(default=0, help_text="En metres")
    temps_estimat = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="En hores")
    
    # Tracks i Mapes
    track_complet = models.JSONField(null=True, blank=True, help_text="GeoJSON complet pre-unit per al mapa.")
    perfil_elevacio = models.JSONField(null=True, blank=True, help_text="Array amb les dades detallades de distància i elevació")
    
    data_creacio = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.nom

class ItinerariNode(models.Model):
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='nodes')
    ordre = models.IntegerField()
    # Es manté la precisió alta per evitar errors de GPS
    latitud = models.DecimalField(max_digits=10, decimal_places=8)
    longitud = models.DecimalField(max_digits=11, decimal_places=8)
    altitud = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
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

    # Dades geomètriques i càlculs
    track_geojson = models.JSONField(null=True, blank=True, help_text="Track calculat per ORS o coordenades exactes")
    distancia_metres = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    desnivell_positiu = models.IntegerField(null=True, blank=True)
    desnivell_negatiu = models.IntegerField(default=0, null=True, blank=True)
    temps_estimat_minuts = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Tram de {self.node_origen.id} a {self.node_desti.id}"

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
    tipus = models.CharField(max_length=50, choices=TIPUS_SERVEI)
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
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='valoracions')
    puntuacio = models.IntegerField(null=True, blank=True)  # La nota de l'1 al 5
    like = models.BooleanField() # True = Like, False = Dislike
    data_valoracio = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('usuari', 'ruta')

    def __str__(self):
        return f"Valoració de {self.usuari.username} a {self.ruta.nom}"

class Comentari(models.Model):
    usuari = models.ForeignKey(Usuari, on_delete=models.CASCADE)
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='comentaris')

    # Enllacem el comentari amb la seva valoració (OneToOne)
    valoracio_rel = models.OneToOneField(
        Valoracio,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='comentari_text'
    )

    descripcio = models.TextField()
    data_creacio = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comentari de {self.usuari.username} a {self.ruta.nom}"

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

# ==========================================
# 7. JWT AUTHENTICATION
# ==========================================
class TokenJWT2(models.Model):
    user = models.ForeignKey(Usuari, on_delete=models.CASCADE)
    token = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Security token for: {self.user.username}"