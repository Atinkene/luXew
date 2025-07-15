import tkinter.messagebox as messagebox

def afficherErreur(titre, message):
    messagebox.showerror(titre, message)

def afficherInfo(titre, message):
    messagebox.showinfo(titre, message)

def demanderConfirmation(titre, message):
    return messagebox.askyesno(titre, message)
