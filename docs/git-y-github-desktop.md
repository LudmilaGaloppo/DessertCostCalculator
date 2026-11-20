# Git y GitHub Desktop: guía rápida

Referencia de los términos y comandos más útiles, con ejemplos de este proyecto. Git tiene muchos comandos; acá están los habituales y algunos avanzados para reconocerlos cuando aparezcan.

## Git, GitHub y GitHub Desktop

| Nombre | Qué es |
|---|---|
| **Git** | La herramienta que registra el historial de cambios de tu proyecto |
| **GitHub** | El servicio donde alojás el repositorio en internet |
| **GitHub Desktop** | La aplicación que permite trabajar con Git y GitHub mediante botones |

Podés alternar terminal y Desktop: si usás la misma carpeta, ambos trabajan con el mismo repositorio.

## Las palabras que vas a encontrar

| Palabra | Significado simple |
|---|---|
| **Repository / repo** | El proyecto junto con su historial de Git |
| **Local** | Lo que está en tu computadora |
| **Remote / remoto** | Otro repositorio conectado; en tu caso, el de GitHub |
| **`origin`** | El nombre que le damos a esa conexión remota. No es tu usuario ni el nombre del proyecto |
| **Branch / rama** | Una línea de trabajo dentro del repositorio |
| **`main`** | Nombre habitual de la rama principal |
| **Working tree** | Los archivos que estás editando en tu carpeta |
| **Stage / staging / index** | La selección de cambios que preparaste para el próximo commit |
| **Commit** | Un punto del historial que registra los cambios preparados, con autor y mensaje |
| **Hash / SHA** | El identificador de un commit, por ejemplo `2212d38` en su forma corta |
| **`HEAD`** | Señala el commit en el que estás trabajando; normalmente sigue a tu rama actual |
| **Upstream** | La rama remota asociada a tu rama local para sincronizarla |
| **`origin/main`** | La referencia local del último estado conocido de `main` en `origin`; no se actualiza sola |
| **Diff** | La comparación que muestra líneas agregadas y eliminadas |
| **Conflict / conflicto** | Cambios que Git no puede combinar automáticamente y que tenés que resolver |

**Guardar un archivo, hacer commit y hacer push son pasos distintos:**

```text
Editás y guardás → preparás cambios (add) → registrás una versión (commit) → la subís (push)
```

## Comandos para el día a día

Ejecutalos desde la carpeta del proyecto. `archivo` y `nombre-rama` son ejemplos que reemplazás por el nombre real.

| Comando | Qué hace |
|---|---|
| `git status` | Muestra la rama actual y los cambios pendientes |
| `git diff` | Muestra cambios en archivos seguidos que todavía no preparaste |
| `git diff --staged` | Muestra lo que entraría en el próximo commit |
| `git add archivo` | Prepara los cambios de ese archivo |
| `git add .` | Prepara cambios, archivos nuevos y eliminaciones desde la carpeta actual |
| `git commit -m "Mensaje"` | Registra los cambios preparados en tu historial local |
| `git push` | Envía tus commits al remoto configurado |
| `git fetch origin` | Descarga novedades y actualiza las referencias del remoto, sin integrarlas en tu trabajo |
| `git pull` | Descarga novedades y las integra en la rama actual; puede usar merge o rebase según la configuración |
| `git log --oneline` | Muestra el historial resumido, un commit por línea |
| `git show 2212d38` | Muestra los detalles y cambios de ese commit |

Un `fetch` te deja inspeccionar las novedades antes de incorporarlas; `pull` también las integra. [Referencia de Git sobre pull](https://git-scm.com/docs/git-pull).

En `status`, **untracked** significa archivo nuevo aún no seguido; **modified**, archivo modificado; **staged**, cambio preparado; y **working tree clean**, sin cambios locales pendientes. **Ahead** indica commits locales pendientes de subir; **behind**, commits remotos pendientes de incorporar, según la información que Git conoce.

## Crear, conectar y cambiar de rama

| Comando | Qué hace |
|---|---|
| `git init -b main` | Inicia Git en una carpeta y llama `main` a la primera rama |
| `git clone URL` | Descarga un repositorio con su historial a una carpeta nueva |
| `git remote -v` | Muestra las conexiones remotas y sus direcciones |
| `git remote add origin URL` | Agrega una conexión llamada `origin` |
| `git remote set-url origin URL` | Cambia la dirección de un `origin` existente |
| `git push -u origin main` | Sube `main` a `origin` y recuerda esa relación para futuros push y pull |
| `git branch` | Lista las ramas locales; marca la actual con `*` |
| `git switch -c nombre-rama` | Crea una rama y te cambia a ella |
| `git switch main` | Te cambia a `main` |
| `git merge nombre-rama` | Integra esa rama en la rama donde estás parado |
| `git branch -m nuevo-nombre` | Renombra la rama actual |
| `git branch -d nombre-rama` | Borra una rama local si Git considera que está integrada |

El error que tuvimos, **`remote origin already exists`**, significaba que la conexión ya existía. Había que usar `set-url`, no volver a agregarla. **`Repository not found`** puede indicar una URL incorrecta, un repositorio inexistente o falta de acceso. [Referencia sobre remotos](https://docs.github.com/en/get-started/git-basics/managing-remote-repositories).

## Deshacer y guardar trabajo temporalmente

Estos comandos tienen efectos distintos: elegí según qué quieras conservar.

| Comando | Qué hace |
|---|---|
| `git restore --staged archivo` | Saca el archivo del próximo commit y conserva tus modificaciones en la carpeta |
| `git restore archivo` | Descarta las modificaciones no preparadas de un archivo seguido y lo repone desde el staging |
| `git revert HASH` | Crea un commit nuevo que deshace los cambios de otro commit, conservando el historial |
| `git stash push -u -m "Pendiente"` | Guarda temporalmente cambios sin commit, incluyendo archivos nuevos no ignorados |
| `git stash list` | Lista esos guardados temporales |
| `git stash pop` | Recupera el último guardado y lo elimina del stash si se aplica correctamente; puede haber conflictos |

`restore --staged` cambia la selección; `restore` sin esa opción puede descartar tu edición del archivo. [Referencia de Git sobre restore](https://git-scm.com/docs/git-restore).

## Otras palabras y opciones

| Término | Para reconocerlo |
|---|---|
| **Pull request / PR** | Propuesta para revisar e integrar una rama en otra en GitHub. No es lo mismo que `git pull` |
| **Fork** | Copia de un repositorio en otra cuenta o espacio de GitHub |
| **Tag** | Etiqueta sobre un punto del historial, por ejemplo `v1.0.0` |
| **Rebase** | Reaplica commits sobre otra base y cambia sus identificadores |
| **Cherry-pick** | Aplica en tu rama los cambios de un commit seleccionado |
| **Amend** | Modifica el último commit; cambia su identificador |
| **Reset** | Ajusta la posición de la rama y/o el staging según sus opciones; `--hard` también puede descartar cambios en archivos |
| **Force push** | Fuerza una actualización remota que puede reemplazar historial; requiere entender qué se está sobrescribiendo |
| **Reflog** | Historial local de movimientos de referencias; puede ayudar a encontrar commits anteriores |
| **`-m`** | En `commit -m`, indica el mensaje. En `branch -m`, renombra: las opciones dependen del comando |
| **`-u`** | En `push -u`, configura el seguimiento; en `stash -u`, incluye archivos nuevos no seguidos |
| **`-M`** | En `branch -M`, fuerza el renombrado de la rama |
| **`--help`** | Abre la ayuda del comando, por ejemplo `git commit --help` |

## Archivos especiales y configuración

- **`.git/`:** guarda el historial y la configuración local de Git.
- **`.gitignore`:** indica archivos que no querés empezar a seguir. No deja de seguir automáticamente archivos que ya estaban registrados.
- **`git config user.name "Tu nombre"`** y **`git config user.email "Tu correo"`** configuran la autoría para ese repositorio. No inician sesión en GitHub. Con `--global`, se aplican por defecto a tus repositorios del usuario.

En este proyecto se excluyen `node_modules/`, `dist/` y `.node-build/`. El código, los documentos y `package-lock.json` sí se versionan.

## Tu flujo con GitHub Desktop

Para agregar la carpeta que ya tenés: **File → Add local repository → Choose…**, seleccioná `C:\Proyectos\GitHub\DessertCostCalculator` y confirmá con **Add repository**. No necesitás clonarla de nuevo. [Instrucciones oficiales](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-a-repository-from-your-local-computer-to-github-desktop).

| En Desktop | Equivalente o idea en Git |
|---|---|
| **Changes** | Revisar archivos pendientes y sus diferencias: `status` y `diff` |
| Seleccionar archivos o líneas | Elegir qué incluir en el commit: la idea de staging |
| **Summary** | Mensaje del commit |
| **Commit to main** | Registrar los cambios seleccionados en la rama local `main` |
| **History** | Consultar commits anteriores: `log` y `show` |
| **Push origin** | Subir commits: `push` |
| **Current Branch** | Consultar o cambiar la rama de trabajo |

Después de editar en VS Code: revisá **Changes**, seleccioná lo que querés incluir, escribí un mensaje, hacé **Commit to main** y después **Push origin**. [Guía de commits en Desktop](https://docs.github.com/en/desktop/making-changes-in-a-branch/committing-and-reviewing-changes-to-your-project-in-github-desktop).

Antes de empezar, **Fetch origin** comprueba y descarga novedades; si hay cambios para incorporar, aparecerá **Pull origin**. [Guía de sincronización](https://docs.github.com/en/desktop/working-with-your-remote-repository-on-github-or-github-enterprise/syncing-your-branch-in-github-desktop).

## El mismo recorrido desde PowerShell

```powershell
cd C:\Proyectos\GitHub\DessertCostCalculator
git status
git add .
git diff --staged
git commit -m "Agrega guía de Git"
git push
```

`cd` es un comando de la terminal para cambiar de carpeta, no de Git. Escribí cada comando en su propia línea: no agregues `\` al final ni lo pongas en `https://`. El símbolo `>>` que puede mostrar PowerShell es una indicación de continuación, no algo que tengas que copiar.
