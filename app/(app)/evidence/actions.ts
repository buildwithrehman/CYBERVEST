"use server";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function uploadEvidenceAction(formData: FormData, token: string) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: members, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1);

    if (memberError || !members || members.length === 0) {
      throw new Error("No organization found");
    }
    
    const orgId = members[0].organization_id;
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file || !title) throw new Error("File and title are required");

    if (file.size > 20 * 1024 * 1024) {
      throw new Error("File size must be less than 20MB.");
    }

    const allowedTypes = [
      'application/pdf', 'text/csv', 'text/plain', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/msword', 'image/jpeg', 'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Unsupported file type. Allowed: PDF, CSV, TXT, DOCX, JPEG, PNG.");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${orgId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('evidence')
      .upload(filePath, file, { contentType: file.type, upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { error: dbError } = await supabase.from('evidence').insert({
      organization_id: orgId,
      title,
      description: description || null,
      storage_path: filePath,
      evidence_type: file.type || 'application/octet-stream',
      source: 'manual_upload',
      uploaded_by: user.id
    });

    if (dbError) throw new Error(dbError.message);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getEvidenceDownloadUrlAction(path: string, token: string) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: members, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1);

    if (memberError || !members || members.length === 0) {
      throw new Error("No organization found");
    }
    
    const orgId = members[0].organization_id;

    // Verify path belongs to an evidence record for this org
    const { data: evidenceRecord, error: evidenceError } = await supabase
      .from('evidence')
      .select('id')
      .eq('storage_path', path)
      .eq('organization_id', orgId)
      .limit(1);

    if (evidenceError || !evidenceRecord || evidenceRecord.length === 0) {
      throw new Error("Artifact not found or access denied");
    }

    // Generate signed URL
    const { data, error: signError } = await supabase.storage
      .from('evidence')
      .createSignedUrl(path, 60);

    if (signError || !data?.signedUrl) {
      throw new Error(signError?.message || "Failed to generate download URL");
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
