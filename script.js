'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // km
    this.duration = duration; // min
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._calcPace();
  }

  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this._calcSpeed();
  }
  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////
// App Arch
class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevField);
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
        alert('Could not get your position!');
      });
    }
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }
  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));

    const positiveInputs = (...inputs) => inputs.every(input => input > 0);
    const resetInputs = () => {
      inputDistance.value =
        inputDuration.value =
        inputElevation.value =
        inputCadence.value =
          '';
    };
    e.preventDefault();
    // get data
    const coordsMarker = [this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng];
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    //if running then running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //validate data
      if (
        !validInputs(distance, cadence, duration) ||
        !positiveInputs(distance, cadence, duration)
      ) {
        resetInputs();
        return alert('Inputs must be numbers and positive');
      }
      workout = new Running(coordsMarker, distance, duration, cadence);
      this.#workouts.push(workout);
    }
    //if cycling then cycling
    if (type === 'cycling') {
      const elevGain = +inputElevation.value;
      if (
        !validInputs(distance, elevGain, duration) ||
        !positiveInputs(distance, duration)
      ) {
        resetInputs();
        return alert('Inputs must be numbers and positive');
      }
      workout = new Cycling(coordsMarker, distance, duration, elevGain);
    }

    // add new object to the workout array
    this.#workouts.push(workout);
    //render workout on the map
    this._renderWorkout(workout);
    // render workout on the list
    // reset form and hide it
    resetInputs();
    form.classList.add('hidden');
  }
  _renderWorkout(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.distance}`)
      .openPopup();
  }
}

const app = new App();
