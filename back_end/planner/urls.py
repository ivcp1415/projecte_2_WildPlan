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
    path('rutes/<int:pk>/eliminar/', views.delete_ruta, name='eliminar-ruta'),
    path('rutes/<int:pk>/verificar/', views.verificar_ruta, name='verificar-ruta'),

    # ==========================
    # 4. INTERACCIÓ SOCIAL
    # ==========================
    path('rutes/opinio/', views.add_opinion, name='afegir_opinio_completa'),
    path('opinions/<int:pk>/delete/', views.delete_opinio, name='delete-opinio'),
]