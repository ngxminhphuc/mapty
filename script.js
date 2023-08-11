'use strict';

// prettier-ignore
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  #id = `${Date.now()}`.slice(-10);
  #date = new Date();
  #type;
  #icon;
  #status;
  #coords;
  #distance;
  #duration;

  constructor(coords, distance, duration) {
    this.#coords = coords;
    this.#distance = distance; // km
    this.#duration = duration; // minute
  }

  get id() {
    return this.#id;
  }

  get date() {
    return this.#date;
  }

  get type() {
    return this.#type;
  }

  set type(str) {
    this.#type = str;
    return this;
  }

  get icon() {
    return this.#icon;
  }

  set icon(str) {
    this.#icon = str;
    return this;
  }

  get status() {
    return this.#status;
  }

  _setStatus() {
    this.#status = `${this.type.replace(
      this.type[0],
      this.type[0].toUpperCase()
    )} on ${monthNames[this.date.getMonth()]} ${this.date.getDate()}`;
    return this;
  }

  get coords() {
    return this.#coords;
  }

  get distance() {
    return this.#distance;
  }

  get duration() {
    return this.#duration;
  }
}

class Running extends Workout {
  #cadence;
  #pace;

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.type = 'running';
    this.icon = '🏃🏻‍♂️';
    this._setStatus();
    this.#cadence = cadence; // step/min
    this.#pace = this.calcPace(); // min/km
  }

  get cadence() {
    return this.#cadence;
  }

  get pace() {
    return this.#pace;
  }

  calcPace() {
    return this.duration / this.distance;
  }

  stringifyObj() {
    return {
      ['id']: this.id,
      ['date']: this.date,
      ['type']: this.type,
      ['icon']: this.icon,
      ['status']: this.status,
      ['coords']: this.coords,
      ['distance']: this.distance,
      ['duration']: this.duration,
      ['cadence']: this.cadence,
      ['pace']: this.pace,
    };
  }
}

class Cycling extends Workout {
  #elevationGain;
  #speed;

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.type = 'cycling';
    this.icon = '🚴🏻‍♂️';
    this._setStatus();
    this.#elevationGain = elevationGain; // meters
    this.#speed = this.calcSpeed(); // km/h
  }

  get elevationGain() {
    return this.#elevationGain;
  }

  get speed() {
    return this.#speed;
  }

  calcSpeed() {
    return this.distance / (this.duration / 60);
  }

  stringifyObj() {
    return {
      ['id']: this.id,
      ['date']: this.date,
      ['type']: this.type,
      ['icon']: this.icon,
      ['status']: this.status,
      ['coords']: this.coords,
      ['distance']: this.distance,
      ['duration']: this.duration,
      ['elevationGain']: this.elevationGain,
      ['speed']: this.speed,
    };
  }
}

class App {
  #map;
  #mapZoomLevel = 16;
  #mapEvent;
  #workouts = [];

  constructor() {
    this.#getPosition().#retrieveLocalStorage();

    form.addEventListener('submit', this.#newWorkout.bind(this));
    inputType.addEventListener('change', this.#toggleField.bind(this));
    containerWorkouts.addEventListener('click', this.#moveToPopup.bind(this));
  }

  #getPosition() {
    // Avoid errors from old browser
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      this.#loadMap.bind(this),
      function () {
        alert('Could not get your current location.');
      }
    );
    return this;
  }

  #loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          content: `Your current position`,
        })
      )
      .openPopup();

    this.#map.setView(coords, this.#mapZoomLevel);

    this.#map.on('click', this.#showForm.bind(this));

    this.#workouts.forEach(workout => this.#displayWorkoutMarker(workout));
  }

  #showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
    return this;
  }

  #hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);

    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    return this;
  }

  #toggleField() {
    inputCadence.value = '';
    inputElevation.value = '';

    inputCadence
      .closest('.form__field')
      .classList.toggle('form__field--hidden');
    inputElevation
      .closest('.form__field')
      .classList.toggle('form__field--hidden');
  }

  #displayWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
          content: workout.status,
        })
      )
      .openPopup();
    return this;
  }

  #displayWorkout(workout) {
    let workoutHTMLByType;
    switch (workout.type) {
      case 'running':
        workoutHTMLByType = `
        <div class="workout__details">
          <span class="workout__icon">⚡</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">SPM</span>
        </div>`;

        break;
      case 'cycling':
        workoutHTMLByType = `
          <div class="workout__details">
            <span class="workout__icon">⚡</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>`;
        break;
      default:
        break;
    }
    const workoutHTMLEl = `
      <li
        class="workout workout--${workout.type}" 
        data-id="${workout.id}"
      >
        <h2 class="workout__title">${workout.status}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.icon}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>${workoutHTMLByType}
      </li>`;
    containerWorkouts.insertAdjacentHTML('afterbegin', workoutHTMLEl);
    return this;
  }

  #stringify() {
    const workoutObjects = this.#workouts.map(workout =>
      workout instanceof Workout ? workout.stringifyObj() : workout
    );
    return JSON.stringify(workoutObjects);
  }

  #saveLocalStorage() {
    localStorage.setItem('workouts', this.#stringify());
    return this;
  }

  #retrieveLocalStorage() {
    const data = localStorage.getItem('workouts');
    if (!data) return;

    this.#workouts = JSON.parse(data);
    this.#workouts.forEach(workout => this.#displayWorkout(workout));

    return this;
  }

  #newWorkout(e) {
    const areValidInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const arePositiveNumbers = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !areValidInputs(distance, duration, cadence) ||
        !arePositiveNumbers(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    } else if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !areValidInputs(distance, duration, elevation) ||
        !arePositiveNumbers(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);
    this.#displayWorkout(workout).#displayWorkoutMarker(workout);
    this.#saveLocalStorage().#hideForm();
  }

  #moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
