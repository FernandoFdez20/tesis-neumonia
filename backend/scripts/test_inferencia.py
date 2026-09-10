from app.ml.modelo_manager import inicializar_modelo, get_modelo
from app.ml.inferencia import preprocesar_imagen, predecir, etiqueta_de

inicializar_modelo()
modelo = get_modelo()

ruta = '../uploads/radiografias/2/0f4ade3fa8ad4794982feb351f6cd96d.dcm'
arr, ds = preprocesar_imagen(ruta)
prob = predecir(modelo, arr)
et = etiqueta_de(prob)
confianza = prob if et == 1 else 1.0 - prob
resultado = "Positivo para neumonía" if et else "Sin signos de neumonía"

print("=" * 50)
print(f"Probabilidad neumonía : {prob:.4f} ({prob:.2%})")
print(f"Etiqueta              : {et}")
print(f"Resultado             : {resultado}")
print(f"Confianza             : {confianza:.2%}")
print("=" * 50)
