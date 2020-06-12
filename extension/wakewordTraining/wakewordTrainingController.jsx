/* globals React, ReactDOM, tf, speechCommands */

// eslint-disable-next-line no-unused-vars
import * as wakewordTrainingView from "./wakewordTrainingView.js";

const { useState, useEffect } = React;
const wakewordTrainingContainer = document.getElementById(
  "wakeword-training-container"
);
let isInitialized = false;
let transferRecognizer;

export const WakewordTrainingController = function() {
  const [savedModels, setSavedModels] = useState([]);
  const [heyFirefoxExamples, setHeyFirefoxExamples] = useState([]);
  const [nextSlidePleaseExamples, setNextSlidePleaseExamples] = useState([]);
  const [backgroundNoiseExamples, setBackgroundNoiseExamples] = useState([]);

  let recognizer;

  const COLLECT_EXAMPLE_OPTIONS = {
    includeRawAudio: true,
  };

  const BACKGROUND_DURATION = 10;
  const WAKEWORD_DURATION = 2;

  useEffect(() => {
    if (!isInitialized) {
      isInitialized = true;
      init();
    }
  });

  const init = async () => {
    await loadBaseRecognizer();
    await loadSavedModels();
    await loadTransferRecognizer(); // for now, assume there's only one transfer model allowed
    // await showExamples();
  };

  const loadBaseRecognizer = async () => {
    recognizer = speechCommands.create("BROWSER_FFT");
    await recognizer.ensureModelLoaded();
    console.log(recognizer.wordLabels());
  };

  const loadSavedModels = async () => {
    const models = await speechCommands.listSavedTransferModels();
    setSavedModels(models);
  };

  const loadTransferRecognizer = async () => {
    transferRecognizer = recognizer.createTransfer("temp-default"); // TODO: CONVERT TO DEFAULT AFTER TESTING
    console.log(transferRecognizer);
    // await transferRecognizer.load();
  };

  const showExamples = async () => {
    console.log(transferRecognizer.countExamples());
  };

  const onTrainExample = async wakeword => {
    let collectExampleOptions = COLLECT_EXAMPLE_OPTIONS;
    if (wakeword === "_background_noise_") {
      collectExampleOptions.durationSec = BACKGROUND_DURATION;
    } else {
      collectExampleOptions.durationMultiplier = WAKEWORD_DURATION;
    }
    const spectogram = await transferRecognizer.collectExample(
      wakeword,
      collectExampleOptions
    );
    switch (wakeword) {
      case "_background_noise_":
        setBackgroundNoiseExamples(examples => examples.concat(spectogram));
        break;
      case "heyFirefox":
        setHeyFirefoxExamples(examples => examples.concat(spectogram));
        break;
      case "nextSlidePlease":
        setNextSlidePleaseExamples(examples => examples.concat(spectogram));
        break;
    }
  };

  return (
    <wakewordTrainingView.WakewordTraining
      savedModels={savedModels}
      onTrainExample={onTrainExample}
      heyFirefoxExamples={heyFirefoxExamples}
      nextSlidePleaseExamples={nextSlidePleaseExamples}
      backgroundNoiseExamples={backgroundNoiseExamples}
    />
  );
};

ReactDOM.render(<WakewordTrainingController />, wakewordTrainingContainer);