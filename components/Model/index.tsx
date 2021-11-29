import "@google/model-viewer";

interface Props {
  src: string;
}

const Model = ({ src }: Props) => (
  <div id="model-container">
    {/* @ts-ignore */}
    <model-viewer
      src={src}
      alt="3D Model"
      shadow-intensity="1"
      camera-controls
      auto-rotate
      ar
    />
  </div>
);

export default Model;
