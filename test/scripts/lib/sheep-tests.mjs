const clinicalSymptoms = ['clinicalSymptomsPresent', 'clinicalSymptomsNotPresent']
const positiveNegative = ['positive', 'negative']
const problem = ['problemIdentified', 'noProblemIdentified']

const bd = positiveNegative
const cla = positiveNegative
const coccidiosis = clinicalSymptoms
const codd = clinicalSymptoms
const eae = positiveNegative
const eweNutritionStatus = problem
const flystrike = clinicalSymptoms
const footRot = clinicalSymptoms
const granuloma = clinicalSymptoms
const haemonchosis = clinicalSymptoms
const heelOrToeAbscess = clinicalSymptoms
const johnes = positiveNegative
const jointIll = clinicalSymptoms
const lambDysentery = positiveNegative
const lambNutritionStatus = problem
const liverFluke = clinicalSymptoms
const loupingIll = clinicalSymptoms
const mastitis = clinicalSymptoms
const mv = positiveNegative
const opa = clinicalSymptoms
const orf = clinicalSymptoms
const pasteurellosis = clinicalSymptoms
const pge = clinicalSymptoms
const pulpyKidney = positiveNegative
const scald = clinicalSymptoms
const sheepScab = positiveNegative
const shellyHoof = clinicalSymptoms
const tickBorneFever = positiveNegative
const tickPyaemia = clinicalSymptoms
const toxoplasmosis = positiveNegative
const traceElements = problem
const wateryMouth = clinicalSymptoms

const sheepEndemicsPackages = {
  improvedEwePerformance: {
    johnes,
    mv,
    cla,
    opa,
    traceElements,
    liverFluke,
    haemonchosis,
    eweNutritionStatus,
    mastitis,
    tickBorneFever,
    loupingIll,
    orf,
    pulpyKidney
  },
  improvedReproductivePerformance: {
    eae,
    bd,
    toxoplasmosis,
    eweNutritionStatus,
    traceElements,
    liverFluke,
    tickBorneFever
  },
  improvedLambPerformance: {
    bd,
    traceElements,
    liverFluke,
    pge,
    coccidiosis,
    mastitis,
    tickBorneFever,
    loupingIll,
    tickPyaemia,
    lambNutritionStatus,
    orf,
    pulpyKidney,
    lambDysentery,
    pasteurellosis
  },
  improvedNeonatalLambSurvival: {
    bd,
    toxoplasmosis,
    jointIll,
    eweNutritionStatus,
    traceElements,
    wateryMouth,
    mastitis,
    tickPyaemia,
    lambDysentery,
    pasteurellosis
  },
  reducedExternalParasites: {
    flystrike,
    sheepScab
  },
  reducedLameness: {
    jointIll,
    tickBorneFever,
    footRot,
    scald,
    codd,
    granuloma,
    heelOrToeAbscess,
    shellyHoof,
    tickPyaemia
  }
}

export { sheepEndemicsPackages }
