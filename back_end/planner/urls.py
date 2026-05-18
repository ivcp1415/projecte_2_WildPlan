# back_end/rutes/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ==========================
    # 1. AUTENTICACIÓ I REGISTRE
    # ==========================
    path('login/', views.login_view, name='login'),
    path('registre/', views.register, name='registre_persona'),

    # ==========================
    # 2. PERFILS D'USUARI
    # ==========================
    path('usuaris/<int:pk>/', views.retrieve_usuari, name='perfil-usuari'),
    path('usuaris/<int:pk>/editar/', views.update_usuari, name='update_usuari'),
    path('usuaris/<int:pk>/rutes/', views.list_rutes_propies, name='llistat-rutes-propies'),

    # ==========================
    # 3. RUTES I TRAMS
    # ==========================
    path('rutes/', views.list_rutes, name='llistat-rutes'),
    path('rutes/crear/', views.crear_rutes, name='crear_rutes'),
    path('rutes/<int:pk>/', views.retrieve_ruta, name='detall-ruta'),
    path('rutes/<int:pk>/editar/', views.edit_rutes, name='editar-ruta'),
    path('rutes/<int:pk>/editar-meta/', views.update_ruta_meta, name='editar-meta-ruta'),
    path('rutes/<int:pk>/eliminar/', views.delete_ruta, name='eliminar-ruta'),
    path('rutes/<int:pk>/verificar/', views.verificar_ruta, name='verificar-ruta'),
    path('rutes/<int:pk>/clonar/', views.clonar_ruta, name='clonar-ruta'),
    path('rutes/<int:pk>/editar-dades/', views.get_ruta_per_editar, name='get-ruta-per-editar'),

    # ==========================
    # 4. INTERACCIÓ SOCIAL
    # ==========================
    path('rutes/opinio/', views.add_opinion, name='afegir_opinio_completa'),
    path('opinions/<int:pk>/delete/', views.delete_opinio, name='delete-opinio'),

    # ==========================
    # 5. CATÀLEG MATERIAL / MENJAR
    # ==========================
    path('materials/', views.list_materials, name='list-materials'),
    path('materials/crear/', views.crear_material, name='crear-material'),
    path('menjars/', views.list_menjars, name='list-menjars'),
    path('menjars/crear/', views.crear_menjar, name='crear-menjar'),

    # ==========================
    # 6. MOTXILLA
    # ==========================
    path('usuaris/<int:pk>/motxilles/', views.list_motxilles_usuari, name='list-motxilles-usuari'),
    path('motxilles/crear/', views.crear_motxilla, name='crear-motxilla'),
    path('motxilles/<int:pk>/', views.retrieve_motxilla, name='retrieve-motxilla'),
    path('motxilles/<int:pk>/editar/', views.update_motxilla, name='update-motxilla'),
    path('motxilles/<int:pk>/eliminar/', views.delete_motxilla, name='delete-motxilla'),
    path('motxilles/<int:pk>/materials/', views.afegir_material_motxilla, name='afegir-material-motxilla'),
    path('motxilles/<int:pk>/materials/<int:material_pk>/', views.eliminar_material_motxilla, name='eliminar-material-motxilla'),
    path('motxilles/<int:pk>/menjars/', views.afegir_menjar_motxilla, name='afegir-menjar-motxilla'),
    path('motxilles/<int:pk>/menjars/<int:menjar_pk>/', views.eliminar_menjar_motxilla, name='eliminar-menjar-motxilla'),

    # ==========================
    # 7. PLANIFICACIÓ
    # ==========================
    path('usuaris/<int:pk>/planificacions/', views.list_planificacions_usuari, name='list-planificacions-usuari'),
    path('rutes/<int:pk>/planificacions/', views.list_planificacions_ruta, name='list-planificacions-ruta'),
    path('planificacions/crear/', views.crear_planificacio, name='crear-planificacio'),
    path('planificacions/<int:pk>/', views.retrieve_planificacio, name='retrieve-planificacio'),
    path('planificacions/<int:pk>/editar/', views.update_planificacio, name='update-planificacio'),
    path('planificacions/<int:pk>/eliminar/', views.delete_planificacio, name='delete-planificacio'),
    path('planificacions/<int:pk>/despeses/', views.afegir_despesa, name='afegir-despesa'),
    path('despeses/<int:pk>/eliminar/', views.eliminar_despesa, name='eliminar-despesa'),

    # ==========================
    # 8. ALERTES / RISCOS
    # ==========================
    path('rutes/<int:pk>/riscos/', views.list_riscos_ruta, name='list-riscos-ruta'),
    path('rutes/<int:pk>/alertes/', views.list_alertes_ruta, name='list-alertes-ruta'),
    path('alertes/crear/', views.crear_alerta, name='crear-alerta'),

    # ==========================
    # 9. CLIMA
    # ==========================
    path('clima/', views.get_clima, name='clima'),

    # ==========================
    # 10. CHATBOT IA
    # ==========================
    path('chat/', views.claude_chatbot, name='claude-chatbot'),
]