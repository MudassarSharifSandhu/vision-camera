import { Skia, Canvas, Image, useImage } from "@shopify/react-native-skia";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,

  View,
} from "react-native";

import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,

} from "react-native-vision-camera";
import {
  Face,
  useFaceDetector,
  FaceDetectionOptions
} from 'react-native-vision-camera-face-detector'
import 'react-native-reanimated'

import { Worklets } from "react-native-worklets-core";
import Config from "../config/config";


const paint = Skia.Paint();
paint.setColor(Skia.Color("blue"));

const colors = ["red", "green", "blue"] as const;

type BoundingBox = {
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  label: string;
};

type DetectionLocation = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  label: string;
};

const modelsInput = {
  ssd_mobilenet_v1: {
    input: {
      shape: {
        width: 300,
        height: 300,
      },
    },
    modelAsset: require("../../assets/ssd_mobilenet_v1.tflite") as number,
  },
  efficient: {
    input: {
      shape: {
        width: 320,
        height: 320,
      },
    },
    modelAsset: require("../../assets/efficient.tflite") as number,
  },
};

type TFLiteModel = keyof typeof modelsInput;

const tfLiteModels = Object.keys(modelsInput) as TFLiteModel[];

export function RecordVideoAndDetectScreen() {
  const faceDetectionOptions = useRef<FaceDetectionOptions>( {
  } ).current
  console.log("faceDetectionOptions",faceDetectionOptions)
  
  const { detectFaces } = useFaceDetector( faceDetectionOptions )
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");
  const camera = useRef<Camera>(null);
  const [photoPath, setPhotoPath] = useState<string>();
  const image = useImage(`file://${photoPath}`);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBorderColor, setRecordingBorderColor] = useState('transparent');
  const [detections, setDetections] = useState<BoundingBox[]>([]);
  

  const handleDetectedFaces = Worklets.createRunOnJS((faces: Face[]) => {
    console.log('faces detected', faces);
    if (faces.length > 0) {
      const faceDetections = faces.map((face) => {
        const { x, y, width, height } = face.bounds;
        return {
          left: x,
          top: y,
          width: width,
          height: height,
          color: 'blue', 
          label: 'Detected Face', 
        };
      });
      setDetections(faceDetections);
    } else {
      setDetections([]);
    }
  });
  

    const frameProcessor = useFrameProcessor((frame) => {
      'worklet'
      const faces = detectFaces(frame)
      handleDetectedFaces(faces)
    }, [handleDetectedFaces])
 
  const startRecording = async () => {
    if (!camera.current || isRecording) return;
    setIsRecording(true);
    setRecordingBorderColor('red');
    try {
      const video = await camera.current.startRecording({
        
        onRecordingFinished: (video) => {
          console.log("video",video)
          setIsRecording(false);
          setRecordingBorderColor('transparent');
          uploadVideo(video.path);
        },
        onRecordingError: (error) => {
          console.error('Recording Error:', error);
          setIsRecording(false);
        },
      });
  
    
      setTimeout(() => {
        if (camera.current) {
          camera.current.stopRecording();
        }
      }, 10000);
    } catch (error) {
      console.error('Start Recording Error:', error);
      setIsRecording(false);
    }
  };
  // const stopRecording = () => {
  //   if (camera.current && isRecording) {
  //     camera.current.stopRecording();
  //     setIsRecording(false);
  //   }
  // }
 


  async function uploadVideo(videoPath) {
    console.log("videoPath", videoPath);
    const formData = new FormData();
    formData.append('video', {
      name: 'video.mp4',
      type: 'video/mp4',
      uri: Platform.OS === 'android' ? `file://${videoPath}` : videoPath,
    });
  
    try {
      const response = await fetch(`${Config.API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      console.log("response",response)
      if (!response.ok) {
        throw new Error('Video upload failed');
      }
  
      console.log('Video uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
    }
  }
  
  useEffect(() => {
    if (!hasPermission) {
      requestPermission().then((permission) => {
        if (!permission) {
          console.log("Permission not granted");
        }
      });
    }
  }, [hasPermission]);

  if (!hasPermission) {
    return <Text>No Camera Permission</Text>;
  }

  if (device == null) return <Text>No Camera Device</Text>;

  return (
    <View style={styles.container}>
       {detections.map((d, idx) => (
        <View
          key={`detection_${idx}_${d.left}_${d.top}`}
          style={[
            styles.face,
            {
              left: d.left,
              top: d.top,
              width: d.width,
              height: d.height,
              borderColor: d.color,
            },
          ]}
        >
          <Text style={styles.faceLabel}>
            {d.label}
          </Text>
        </View>
      ))}
      {!photoPath && (
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          photo={true}
          isActive={!photoPath}
          // pixelFormat="rgb"
          frameProcessor={frameProcessor}
          video={true} 
        />
      )}



    

      {!photoPath && (
        <Pressable
        style={{
          position: "absolute",
          bottom: 50,
          left: "50%",
          marginLeft: -40, 
          backgroundColor: "skyblue",
          width: 80, 
          height: 80, 
          borderRadius: 40, 
          zIndex: 10000,
          borderColor: recordingBorderColor,
          borderWidth: isRecording ? 4 : 0, 
        }}
        disabled={isRecording}
        onPress={startRecording}
      />
       
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  face: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'red',
    backgroundColor: 'transparent',
    zIndex: 10, 
  },
  faceLabel: { 
    color: "white",
    padding: 2,
  },
});
