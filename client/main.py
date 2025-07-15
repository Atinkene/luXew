import tkinter as tk
from tkinter import ttk
from services.serviceSoap import ServiceSoap
from vues.ecranConnexion import EcranConnexion
from vues.ecranGestionUtilisateurs import EcranGestionUtilisateurs

def appliquer_style(root):
    style = ttk.Style(root)
    style.theme_use('clam')
    style.configure('TFrame', background='#f3f4f6')
    style.configure('TLabel', background='#f3f4f6', font=('Helvetica', 11))
    style.configure('TButton', font=('Helvetica', 11, 'bold'), padding=6)
    style.configure('Header.TLabel', font=('Helvetica', 18, 'bold'), foreground='#f97316')
    style.configure('Error.TLabel', foreground='#dc2626')
    style.configure('Treeview', font=('Helvetica', 10), rowheight=25)
    style.configure('Treeview.Heading', font=('Helvetica', 11, 'bold'))
    style.map('TButton',
              foreground=[('active', 'white')],
              background=[('active', '#f97316')])

class Application(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("luXew")
        self.geometry("800x600")
        appliquer_style(self)
        
        self.serviceSoap = ServiceSoap("http://localhost/luXew/backend/public/soap.php?wsdl")
        self.token = None
        
        self.container = tk.Frame(self)
        self.container.pack(fill='both', expand=True)
        
        self.frame_actuel = None
        self.afficher_ecran(EcranConnexion)
    
    def afficher_ecran(self, classeEcran, *args):
        if self.frame_actuel:
            self.frame_actuel.destroy()
        
        if classeEcran == EcranConnexion:
            self.frame_actuel = classeEcran(self.container, self)
        else:
            self.frame_actuel = classeEcran(self.container, *args)
        
        self.frame_actuel.pack(fill='both', expand=True)
    
    def naviguer_vers_gestion_utilisateur(self, token):
        self.token = token
        self.afficher_ecran(EcranGestionUtilisateurs, token, self.serviceSoap)

if __name__ == "__main__":
    app = Application()
    app.mainloop()