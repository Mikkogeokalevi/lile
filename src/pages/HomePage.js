import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      <h2>Tervetuloa</h2>
      <p>
        Tämä sovellus on lihavuusleikattujen tukiryhmän yhteinen paikka, jossa voi jakaa hyväksi koettuja vinkkejä.
      </p>

      <div className="grid-2">
        <div className="card">
          <h3>Ruokapaikat</h3>
          <p>
            Lisää ja selaa ruokapaikkoja, joista löytyy sopivia annoksia tai muita hyödyllisiä vinkkejä.
          </p>
          <Link className="btn btn--primary" to="/ruokapaikat">
            Avaa ruokapaikat
          </Link>
        </div>

        <div className="card">
          <h3>Reseptit</h3>
          <p>
            Tallenna ja löydä reseptejä, jotka sopivat arkeen ja toimivat omien tarpeiden mukaan.
          </p>
          <Link className="btn btn--primary" to="/reseptit">
            Avaa reseptit
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Versiohistoria</h3>
        <p>Sivulta näet käyttäjälle näkyvät muutokset ja uudet ominaisuudet.</p>
        <Link className="btn btn--secondary" to="/versiohistoria">
          Avaa versiohistoria
        </Link>
      </div>
    </div>
  );
}
