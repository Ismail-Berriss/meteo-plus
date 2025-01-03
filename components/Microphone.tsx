// import React from "react";
// import { TouchableOpacity } from "react-native";

// const Microphone = () => {
//   return (
//     <>
//       <TouchableOpacity
//         style={styles.micButton}
//         onPress={handleMicrophonePress}
//       >
//         <Mic size={28} color="white" />
//       </TouchableOpacity>

//       <Modal
//         animationType="slide"
//         transparent
//         visible={modalVisible}
//         onRequestClose={handleModalClose}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Mic size={48} color="#007AFF" />
//             {isListening ? (
//               <Text style={styles.listeningText}>I'm listening...</Text>
//             ) : (
//               <Text style={styles.modalDescription}>
//                 Tap the mic and start talking!
//               </Text>
//             )}
//             {isListening && (
//               <ActivityIndicator
//                 size="large"
//                 color="#007AFF"
//                 style={{ marginTop: 20 }}
//               />
//             )}
//             <TouchableOpacity
//               style={styles.closeButton}
//               onPress={handleModalClose}
//             >
//               <Text style={styles.closeButtonText}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </>
//   );
// };

// const styles = StyleSheet.create({});

// export default Microphone;
