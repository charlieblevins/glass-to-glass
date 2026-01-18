import { FormErrors, type FormErrorEnum } from "../model/formErrors";

export default function FormError({ errorEnum }: { errorEnum: FormErrorEnum }) {
  return (
    <>
      {errorEnum === FormErrors.NoScreenRecording ? (
        <div className="form-error">
          <h2>Missing screen recording</h2>
          <p>A screen recording is required to compute latency.</p>
        </div>
      ) : null}
    </>
  );
}
