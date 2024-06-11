import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

const MenuItem = ({
  item,
  route,
  onPress,
}: {
  item: string;
  route: string;
  onPress: (p: string) => void;
}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={() => onPress(route)}>
      <Text style={styles.itemText}>{item}</Text>
    </TouchableOpacity>
  );
};

export const ObjectDetectionMenuItems = () => {
  const { navigate } = useRouter();

  const goToScreen = (route: string) => {
    console.log("route",route)
    navigate(route);
  };

  return (
    <View>
      <View style={{ gap: 32 }}>
        <MenuItem
          onPress={goToScreen}
          item="Record Video And Detect"
          route="record_video_and_detect"
        />
      </View>
    </View>
  );
};

const Menu = () => {
  return (
    <View style={styles.container}>
      <Text
        style={{
          textAlign: "center",
          fontSize: 32,
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        {`Record Video And Detect Face`}
      </Text>

      <ObjectDetectionMenuItems />
    </View>
  );
};

export default Menu;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    gap: 32,
    paddingTop: 64,
  },
  itemText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: "skyblue",
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 36,
  },
});
