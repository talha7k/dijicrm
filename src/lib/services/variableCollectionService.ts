import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "$lib/firebase";
import type {
  VariableTemplate,
  CreateVariableTemplateInput,
  UpdateVariableTemplateInput,
} from "$lib/types/templateVariable";

const COLLECTION_NAME = "variableTemplates";

export async function createVariableTemplate(
  input: CreateVariableTemplateInput,
): Promise<VariableTemplate> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const newDoc = await getDoc(docRef);
  if (!newDoc.exists()) {
    throw new Error("Failed to create variable template");
  }

  return {
    id: newDoc.id,
    ...newDoc.data(),
    createdAt: newDoc.data().createdAt?.toDate() || new Date(),
    updatedAt: newDoc.data().updatedAt?.toDate() || new Date(),
  } as VariableTemplate;
}

export async function getVariableTemplates(
  templateId?: string,
): Promise<VariableTemplate[]> {
  let q;

  if (templateId) {
    q = query(
      collection(db, COLLECTION_NAME),
      where("documentTemplateIds", "array-contains", templateId),
      orderBy("name"),
    );
  } else {
    q = query(collection(db, COLLECTION_NAME), orderBy("name"));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as VariableTemplate[];
}

export async function getVariableTemplateById(
  id: string,
): Promise<VariableTemplate | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate() || new Date(),
    updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
  } as VariableTemplate;
}

export async function getVariableTemplatesByCategory(
  category: string,
): Promise<VariableTemplate[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("category", "==", category),
    where("isActive", "==", true),
    orderBy("name"),
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as VariableTemplate[];
}

export async function updateVariableTemplate(
  id: string,
  input: UpdateVariableTemplateInput,
): Promise<VariableTemplate | null> {
  const docRef = doc(db, COLLECTION_NAME, id);

  await updateDoc(docRef, {
    ...input,
    updatedAt: serverTimestamp(),
  });

  const updatedDoc = await getDoc(docRef);
  if (!updatedDoc.exists()) {
    return null;
  }

  return {
    id: updatedDoc.id,
    ...updatedDoc.data(),
    createdAt: updatedDoc.data().createdAt?.toDate() || new Date(),
    updatedAt: updatedDoc.data().updatedAt?.toDate() || new Date(),
  } as VariableTemplate;
}

export async function deleteVariableTemplate(id: string): Promise<boolean> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
  return true;
}
