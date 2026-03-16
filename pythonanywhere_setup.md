# Deploy na PythonAnywhere (zadarmo, bez karty)

## Krok 1: Registrácia
1. Choď na https://www.pythonanywhere.com
2. Klikni "Start running Python online in less than a minute!"
3. Zaregistruj sa (stačí email, žiadna karta)

## Krok 2: Upload kódu
1. Po prihlásení choď do **Dashboard**
2. Otvor **Bash console** (klikni na "$ Bash")
3. Spusti tieto príkazy:

```bash
git clone https://github.com/losprey94/Apps.git
cd Apps
git checkout claude/price-comparison-scanner-mAgqH
pip install --user -r requirements.txt
```

## Krok 3: Nastav Web App
1. Choď do záložky **Web**
2. Klikni **Add a new web app**
3. Zvol **Flask** a Python 3.11
4. Nastav cestu ku kódu: `/home/TVOJEMENO/Apps`
5. V WSGI súbore zmeň obsah na:

```python
import sys
sys.path.insert(0, '/home/TVOJEMENO/Apps')
from app import app as application
```

6. Klikni **Reload**

## Krok 4: Hotovo!
Tvoja appka beží na: https://TVOJEMENO.pythonanywhere.com

## Krok 5: iPhone
1. Otvor URL v Safari na iPhone
2. Klikni zdieľanie (štvorcová ikona so šipkou)
3. "Pridať na plochu"
```
