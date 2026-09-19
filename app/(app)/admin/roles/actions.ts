"use server";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function inviteMemberAction(email: string, role: string, token: string) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Check if current user is admin in their org
    const { data: members, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1);

    if (memberError || !members || members.length === 0) {
      throw new Error("No organization found");
    }
    
    if (members[0].role !== 'ADMIN') {
      throw new Error("Only an ADMIN can invite new members");
    }
    
    const orgId = members[0].organization_id;

    // Check if user already exists in auth
    // Wait, admin.inviteUserByEmail will send an invite email. 
    // If the user already exists, it will throw an error or we can just fetch the user.
    // Let's see if we can find the user in `profiles` first to avoid duplicates.
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);
      
    let targetUserId = existingProfile && existingProfile.length > 0 ? existingProfile[0].id : null;

    if (!targetUserId) {
      // Invite user
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
      if (inviteError) {
        throw new Error(inviteError.message);
      }
      targetUserId = inviteData.user.id;
    }

    // Check if already in org
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId)
      .limit(1);

    if (existingMember && existingMember.length > 0) {
      throw new Error("User is already a member of this organization");
    }

    // Ensure profile exists before inserting into organization_members
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: targetUserId,
        email: email
      });

    if (profileError) {
      throw new Error("Failed to configure user profile");
    }

    // Insert into organization_members
    const { error: insertError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: targetUserId,
        role: role
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
