# AI Rules - Lihavuusleikattujen tukiryhmän työkalu

## Projektin kuvaus
Web-sovellus lihavuusleikattujen tukiryhmälle, jossa käyttäjät voivat jakaa ruokapaikkoja ja reseptejä.

## Keskeiset vaatimukset

### 1. Versiohistoria (CHANGELOG.md)
- **TÄRKEIN SÄÄNTÖ**: `CHANGELOG.md` on käyttäjille näkyvä versiohistoria (julkaisutiedotteet)
- Changelogiin kirjataan **vain käyttäjälle näkyvät muutokset** (ei admin-näkymän sisäisiä muutoksia, ei kehitys-/refaktorointimerkintöjä)
- Vanhat versiot EI KOSKAAN poistu tai lyhene (append-only)
- Muoto: Päivämäärä + käyttäjälle ymmärrettävä kuvaus muutoksesta
- Päivitä aina kun sovellukseen lisätään tai muutetaan käyttäjälle näkyvää toiminnallisuutta

### 2. Käyttöohjekirja (USER_GUIDE.md)
- Täydellinen käyttöopas käyttäjän näkökulmasta
- Kaikki ominaisuudet yksityiskohtaisesti selitettynä
- Päivitä kun uusia ominaisuuksia lisätään
- Varmista että opas on aina ajan tasalla

### 2.1 Checkpoint-käytäntö (Git)
- Kun käyttäjä sanoo **"tee checkpoint"**, tehdään aina:
  - `git add .`
  - `git commit -m "Checkpoint: <kuvaus>"`
  - `git tag vX.Y-<nimi>`
  - `git push` ja `git push --tags`
- Checkpointin tarkoitus on, että käyttäjä voi palata takaisin toimivaan tilaan myöhemmin.

### 3. Tekninen toteutus
- **Framework**: React.js
- **Authentication**: Firebase (Gmail/sähköposti)
- **Database**: Firebase Firestore
- **PWA**: Täydellinen mobiilituki ja asennusmahdollisuus
- **Responsive**: Toimii kaikilla laitteilla

### 4. Ominaisuudet

#### Ruokapaikat
- Lisää uusi ruokapaikka (nimi, osoite, yhteystiedot, alennustiedot)
- Muokkaa olemassa olevaa
- Tykkäys-toiminto
- Ehdota poistoa (moderaattorin tarkastettavaksi)

#### Reseptikirjasto
- Lisää uusi resepti (ainesosat, ohjeet, ravintotiedot)
- Muokkaa olemassa olevaa
- Tykkäys-toiminto
- Ehdota poistoa

#### Admin-näkymä
- Vain omistajalle näkyvä
- Käyttäjien hallinta (lista, roolit, poistot)
- Poistoehdotusten hyväksyminen/hylkääminen
- Tilastot ja raportit

### 5. Muistettavat säännöt

#### Kehitys
- Aina kun teet muutoksen, päivitä changelog VÄLITTÖMÄSTI
- Testaa mobiiliyhteensopivuus jokaisen muutoksen jälkeen
- Varmista PWA-toimivuus
- Käytä suomeksi käyttöliittymässä

#### Tietoturva
- Firebase security rules kuntoon
- Admin-toiminnot vain oikeutetuille käyttäjille
- Käyttäjätietojen suojaus

#### Käytettävyys
- Selkeä ja yksinkertainen käyttöliittymä
- Saavutettavuus huomioitu
- Nopea latautuminen mobiilissa

### 6. Tiedostorakenne
```
/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   └── styles/
├── CHANGELOG.md
├── USER_GUIDE.md
├── AI_rules.md
└── package.json
```

### 7. Muistettava jatkossa
- Tämä on tukiryhmän työkalu, ei kaupallinen sovellus
- Käyttäjät ovat lihavuusleikattuja, empatia ja tuki keskiössä
- Alennustiedot ovat tärkeitä käyttäjille
- Yhteisöllisyys on avainasemassa
- Admin on vain yksi henkilö (projektin omistaja)

## Kontekstin säilyminen
Koska konteksti loppuu, viittaa tähän tiedostoon jatkossa:
- Versiohistorian säännöt
- Kaikki vaatimukset
- Projektin tarkoitus
- Teknologiat
