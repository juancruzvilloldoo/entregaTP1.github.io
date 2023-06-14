let caminante1, caminante2, caminante3;
let trazo = 6; // Grosor de las líneas
let capa1, capa2, capa3;
let centroX, centroY; // Posición del centro de la pantalla
let analyser;
let reinicioTimer; // Temporizador para reiniciar el programa

// Función para interpolar ángulos
function lerpAngle(start, end, amount) {
  let difference = end - start;
  while (difference < -PI) difference += TWO_PI;
  while (difference > PI) difference -= TWO_PI;
  return start + difference * 2 * amount;
}

function setup() {
  createCanvas(800, 800);
  background(218, 223, 201); // Cambiar color de fondo

  centroX = width / 2;
  centroY = height / 2;

  // Crear las capas
  capa1 = createGraphics(width, height);
  capa2 = createGraphics(width, height);
  capa3 = createGraphics(width, height);

  // Crear los caminantes con posiciones iniciales en las esquinas del lienzo
  let esquinas = [
    { x: 0, y: 0 }, // Esquina superior izquierda
    { x: width, y: 0 }, // Esquina superior derecha
    { x: width, y: height }, // Esquina inferior derecha
    { x: 0, y: height }, // Esquina inferior izquierda
  ];

  let caminanteIndex = floor(random(0, esquinas.length));
  let caminantePos = esquinas[caminanteIndex];

  caminante1 = new Caminante(
    caminantePos.x,
    caminantePos.y,
    capa1,
    color(20, 38, 32, 5)
  );

  esquinas.splice(caminanteIndex, 1); // Eliminar la esquina ya utilizada

  caminanteIndex = floor(random(0, esquinas.length));
  caminantePos = esquinas[caminanteIndex];

  caminante2 = new Caminante(
    caminantePos.x,
    caminantePos.y,
    capa2,
    color(209, 212, 70, 5)
  );

  esquinas.splice(caminanteIndex, 1); // Eliminar la esquina ya utilizada

  caminanteIndex = floor(random(0, esquinas.length));
  caminantePos = esquinas[caminanteIndex];

  caminante3 = new Caminante(
    caminantePos.x,
    caminantePos.y,
    capa3,
    color(120, 168, 162, 5)
  );

  // Ajustar la tensión de las curvas
  curveTightness(-6);

  // Iniciar la captura de audio
  iniciarCapturaAudio();

  // Asignar función de reinicio al presionar la tecla "R"
  window.addEventListener('keypress', reiniciarPrograma);

  // Iniciar el temporizador de reinicio
  reiniciarProgramaTimer();
}

function draw() {
  // Actualizar las capas
  capa1.clear();
  capa2.clear();
  capa3.clear();

  // Dibujar caminantes en las capas
  caminante1.dibujar();
  caminante2.dibujar();
  caminante3.dibujar();

  // Mostrar las capas en el lienzo principal
  image(capa3, 0, 0);
  image(capa2, 0, 0);
  image(capa1, 0, 0);

  // Obtener el nivel de volumen del audio
  let nivelGraves = obtenerNivelGraves();
  let nivelAgudos = obtenerNivelAgudos();

  // Actualizar caminantes según el nivel de volumen de graves y agudos
  let umbralMinimo = 0.05;
  if (nivelGraves > umbralMinimo) {
    caminante2.actualizar(nivelGraves);
    caminante3.actualizar(nivelGraves);
  }
  if (nivelAgudos > umbralMinimo) {
    caminante1.actualizar(nivelAgudos);
  }

  // Reiniciar el programa si no se ha recibido audio en 5 segundos
  if (reinicioTimer && nivelGraves === 0 && nivelAgudos === 0) {
    clearTimeout(reinicioTimer);
    reiniciarProgramaTimer();
  }
}

function reiniciarProgramaTimer() {
  reinicioTimer = setTimeout(function() {
    console.log("No se ha recibido audio en 5 segundos. Reiniciando el programa...");
    setup();
  }, 30000);
}

function reiniciarPrograma(event) {
  if (event.key === 'r' || event.key === 'R') {
    clearTimeout(reinicioTimer);
    reiniciarProgramaTimer();
  }
}

class Caminante {
  constructor(x, y, capa, color) {
    this.x = x;
    this.y = y;
    this.direccion = random(TWO_PI);
    this.nuevaDireccion = this.direccion;
    this.velocidad = 50; // Aumentar la velocidad
    this.historia = [];
    this.capa = capa;
    this.trazo = trazo; // Grosor del trazo
    this.color = color; // Cambiar color y opacidad
  }

  dibujar() {
    this.capa.noFill();
    this.capa.stroke(this.color);
    this.capa.strokeWeight(this.trazo);
    this.capa.beginShape();
    for (let i = 0; i < this.historia.length; i++) {
      let punto = this.historia[i];
      this.capa.curveVertex(punto.x, punto.y);
    }
    this.capa.endShape();
  }

  actualizar(nivelVolumen) {
    // Calcular siguiente posición
    let pasoX = cos(this.direccion) * this.velocidad * nivelVolumen;
    let pasoY = sin(this.direccion) * this.velocidad * nivelVolumen;
    let nuevaX = this.x + pasoX;
    let nuevaY = this.y + pasoY;

    // Verificar si está cerca de los bordes
    let margen = 50; // Margen de proximidad al borde

    if (
      nuevaX < margen ||
      nuevaX > width - margen ||
      nuevaY < margen ||
      nuevaY > height - margen
    ) {
      // Cambiar dirección hacia el centro de la pantalla
      let anguloHaciaCentro = atan2(centroY - nuevaY, centroX - nuevaX);
      this.nuevaDireccion = anguloHaciaCentro;
    } else {
      // Cambiar dirección aleatoriamente
      if (random() < 0.1) {
        this.nuevaDireccion = random(TWO_PI);
      }
    }

    // Interpolar hacia la nueva dirección
    this.direccion = lerpAngle(this.direccion, this.nuevaDireccion, 0.09);

    // Actualizar posición
    this.x = nuevaX;
    this.y = nuevaY;

    // Verificar si está dentro del cuadrado
    let cuadradoX = 0; // Posición X del cuadrado
    let cuadradoY = 0; // Posición Y del cuadrado
    let cuadradoLado = width; // Lado del cuadrado

    if (this.x < cuadradoX) {
      this.x = cuadradoX;
    } else if (this.x > cuadradoX + cuadradoLado) {
      this.x = cuadradoX + cuadradoLado;
    }

    if (this.y < cuadradoY) {
      this.y = cuadradoY;
    } else if (this.y > cuadradoY + cuadradoLado) {
      this.y = cuadradoY + cuadradoLado;
    }

    // Agregar punto a la historia
    this.historia.push({ x: this.x, y: this.y });

    // Limitar la longitud de la historia
    let maxHistoria = 500;
    if (this.historia.length > maxHistoria) {
      this.historia.splice(0, 1);
    }
  }
}

// Función para iniciar la captura de audio
function iniciarCapturaAudio() {
  // Verificar si el navegador es compatible con getUserMedia
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Configuración para capturar solo audio
    const constraints = { audio: true, video: false };

    // Solicitar permiso para acceder al micrófono
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        // Crear un nuevo objeto AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Crear un nuevo objeto AnalyserNode
        analyser = audioContext.createAnalyser();

        // Conectar el AnalyserNode con el stream de audio
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        // Configurar parámetros del AnalyserNode
        analyser.fftSize = 2048;
      })
      .catch(function (err) {
        console.error('Error al acceder al micrófono: ', err);
      });
  } else {
    console.error('getUserMedia no es compatible con este navegador.');
  }
}

// Función para obtener el nivel de volumen de graves del audio
function obtenerNivelGraves() {
  // Verificar si el AnalyserNode está definido
  if (analyser) {
    // Obtener datos de amplitud de la forma de onda
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calcular el promedio de los valores de amplitud de los graves
    const inicioGraves = 0; // Índice inicial de los graves
    const finGraves = Math.floor(bufferLength * 0.25); // Índice final de los graves
    let sumaAmplitud = 0;
    for (let i = inicioGraves; i < finGraves; i++) {
      sumaAmplitud += dataArray[i];
    }
    const promedioAmplitud = sumaAmplitud / (finGraves - inicioGraves);

    // Mapear el promedio de amplitud al rango [0, 1]
    const nivelVolumen = map(promedioAmplitud, 0, 255, 0, 1);
    return nivelVolumen;
  } else {
    return 0;
  }
}

// Función para obtener el nivel de volumen de agudos del audio
function obtenerNivelAgudos() {
  // Verificar si el AnalyserNode está definido
  if (analyser) {
    // Obtener datos de amplitud de la forma de onda
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calcular el promedio de los valores de amplitud de los agudos
    const inicioAgudos = Math.floor(bufferLength * 0.75); // Índice inicial de los agudos
    const finAgudos = bufferLength; // Índice final de los agudos
    let sumaAmplitud = 0;
    for (let i = inicioAgudos; i < finAgudos; i++) {
      sumaAmplitud += dataArray[i];
    }
    const promedioAmplitud = sumaAmplitud / (finAgudos - inicioAgudos);

    // Mapear el promedio de amplitud al rango [0, 1]
    const nivelVolumen = map(promedioAmplitud, 0, 255, 0, 1);
    return nivelVolumen;
  } else {
    return 0;
  }
}
