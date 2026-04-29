import io
import os
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf

app = Flask(__name__)
CORS(app)

# ---- SETTINGS ----
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best_cnn_model.h5")
INPUT_SIZE = (224, 224)   #training size
# ------------------

print("Loading CNN model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded successfully!")

def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(INPUT_SIZE)
    img_array = np.asarray(img).astype(np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    image_bytes = file.read()
    img = preprocess_image(image_bytes)

    preds = model.predict(img)
    prob = float(preds[0][0])

    label = "Pneumonia" if prob >= 0.5 else "Normal"
    confidence = prob if prob >= 0.5 else 1 - prob

    return jsonify({
        "success": True,
        "prediction": label,
        "confidence": confidence
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
