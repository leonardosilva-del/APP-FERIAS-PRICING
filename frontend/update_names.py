import os
import re

frontend_dir = r"c:\Users\leonardo.silva\Documents\APP FERIAS PRICING\frontend"
files = [
    "index.html",
    "ofertas.html",
    "links.html",
    "ferias.html",
    "aniversarios.html",
    "agenda.html"
]

for file_name in files:
    filepath = os.path.join(frontend_dir, file_name)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Diferentes IDs para o nome do usuario
    name_id = "user-name"
    if "user-name-widget" in content:
        name_id = "user-name-widget"

    if file_name == "index.html":
        # in index.html, we modify concluirLogin
        if "document.getElementById('user-name').textContent = dadosUser.nome.split(' ')[0];" not in content:
            content = content.replace(
                "document.getElementById('user-role').textContent = perfilDoBanco;",
                f"document.getElementById('user-role').textContent = perfilDoBanco;\n            if (dadosUser.nome) document.getElementById('{name_id}').textContent = dadosUser.nome.split(' ')[0];"
            )
    else:
        # others
        if f"document.getElementById('{name_id}').textContent = snapshot.val().nome.split(' ')[0];" not in content:
            # We look for get(userRef).then((snapshot) => { if (snapshot.exists()) {
            pattern = re.compile(r"(get\(userRef\)\.then\(\(snapshot\)\s*=>\s*\{\s*if\s*\(snapshot\.exists\(\)\)\s*\{)")
            replacement = f"\\1\n                    if (snapshot.val().nome) document.getElementById('{name_id}').textContent = snapshot.val().nome.split(' ')[0];"
            content = pattern.sub(replacement, content)
            
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print("Done")
