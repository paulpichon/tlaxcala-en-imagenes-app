// TODO: ELIMINAR EL ARCHIVO, YA QUE NO SE USA AHORA USAMOS EL FOLLOWCONTEXT
// 'use client';

// import { useState } from "react";
// import { useAuth } from "@/context/AuthContext";

// export function useFollowButton(userId: string, initialFollowing: boolean, onToggle?: (newState: boolean) => void) {
//   const { fetchWithAuth } = useAuth();
//   const [isFollowing, setIsFollowing] = useState(initialFollowing);
//   const [loading, setLoading] = useState(false);

//   const toggleFollow = async () => {
//     setLoading(true);
//     try {
//       let res;
//       if (isFollowing) {
//         res = await fetchWithAuth(
//           `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/followers/unfollow/${userId}`,
//           { method: "DELETE" }
//         );
//       } else {
//         res = await fetchWithAuth(
//           `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/followers/follow/${userId}`,
//           { method: "POST" }
//         );
//       }

//       if (res.ok) {
//         const newState = !isFollowing;
//         setIsFollowing(newState);
//         onToggle?.(newState); // notifica al padre
//       }
//     } catch (error) {
//       console.error("Error follow/unfollow:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { isFollowing, loading, toggleFollow };
// }
