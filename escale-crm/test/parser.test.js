const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { parseFormEmail } = require('../src/form-parser');

test('analyse un e-mail Gravity Forms', () => {
  const html = fs.readFileSync(path.join(__dirname, 'fixture-form.html'), 'utf8');
  const { client, projectDate, projectEndDate } = parseFormEmail({ html });
  assert.equal(client.contact_name, 'Camille EXEMPLE');
  assert.equal(client.email, 'camille@exemple.fr');
  assert.equal(client.phone, '0600000000');
  assert.equal(client.event_duration, '2 jours');
  assert.equal(client.participants, '10 à 20');
  assert.equal(client.services, 'Activités Nautiques, Hébergements, Sports & Loisirs');
  assert.equal(client.event_month, 'Juin');
  assert.equal(client.rgpd, 'J’accepte la politique de confidentialité.');
  assert.deepEqual(JSON.parse(client.extra_fields), { 'Champ ajouté plus tard': 'valeur libre' });
  assert.equal(projectDate, '2027-06-04');
  assert.equal(projectEndDate, '2027-06-05');
});

test('repli texte « Libellé : valeur »', () => {
  const { client } = parseFormEmail({ text: 'Votre nom : Jean Test\nTéléphone : 0700000000\nNom de société/association : Asso Test' });
  assert.equal(client.contact_name, 'Jean Test');
  assert.equal(client.phone, '0700000000');
  assert.equal(client.company_name, 'Asso Test');
});
