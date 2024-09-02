import torch
from PIL import Image
import io
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse

# Import the CP-VTON model class
from model.cp_vton import CPVTONModel  # Adjust import based on actual model file and class name

app = FastAPI()

# Load the pre-trained GAN model
@app.on_event("startup")
def load_model():
    global cpvton_model
    cpvton_model = CPVTONModel()
    cpvton_model.load_state_dict(torch.load("path_to_pretrained_model.pth"))  # Update the path accordingly
    cpvton_model.eval()

@app.post("/virtual-try-on/")
async def virtual_try_on(user_image: UploadFile = File(...), clothing_image: UploadFile = File(...)):
    try:
        user_image_data = await user_image.read()
        clothing_image_data = await clothing_image.read()

        # Convert images to PIL format
        user_image_pil = Image.open(io.BytesIO(user_image_data))
        clothing_image_pil = Image.open(io.BytesIO(clothing_image_data))

        # Process images using the GAN model
        final_image_tensor = cpvton_model(user_image_pil, clothing_image_pil)

        # Convert tensor to image
        final_image_pil = Image.fromarray(final_image_tensor.cpu().numpy().transpose(1, 2, 0))

        # Save image to bytes
        buffered = io.BytesIO()
        final_image_pil.save(buffered, format="PNG")
        buffered.seek(0)

        return StreamingResponse(buffered, media_type="image/png")

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
