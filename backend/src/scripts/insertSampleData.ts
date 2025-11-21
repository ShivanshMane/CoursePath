import pool from '../config/database';

async function insertSampleData() {
  try {
    console.log('🔄 Inserting sample data...');
    
    // Insert sample user
    const userResult = await pool.query(
      'INSERT INTO users (email, name) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING RETURNING user_id',
      ['demo@depauw.edu', 'Demo User']
    );
    
    let userId = userResult.rows[0]?.user_id;
    if (!userId) {
      // Get existing user
      const existingUser = await pool.query('SELECT user_id FROM users WHERE email = $1', ['demo@depauw.edu']);
      userId = existingUser.rows[0].user_id;
    }
    
    console.log('👤 User ID:', userId);
    
    // Insert sample plan
    const planResult = await pool.query(
      'INSERT INTO plans (user_id, catalog_year, preferences) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING plan_id',
      [userId, 2024, JSON.stringify({
        early_graduation: { target_year: 2026 },
        prior_credits: { ap_credits: 6, transfer_credits: 0 },
        study_abroad: { term: 'Fall', year: 2025 }
      })]
    );
    
    let planId = planResult.rows[0]?.plan_id;
    if (!planId) {
      // Get existing plan
      const existingPlan = await pool.query('SELECT plan_id FROM plans WHERE user_id = $1', [userId]);
      planId = existingPlan.rows[0].plan_id;
    }
    
    console.log('📋 Plan ID:', planId);
    
    // Insert sample courses if they don't exist
    const sampleCourses = [
      { code: 'MATH 151', title: 'Calculus I', credits: 4 },
      { code: 'CS 181', title: 'Introduction to Computer Science', credits: 4 },
      { code: 'ENG 101', title: 'First-Year Writing', credits: 3 },
      { code: 'PHYS 150', title: 'Physics I', credits: 4 },
      { code: 'CHEM 111', title: 'General Chemistry I', credits: 4 }
    ];
    
    for (const course of sampleCourses) {
      await pool.query(
        'INSERT INTO courses (course_code, title, credits, description) VALUES ($1, $2, $3, $4) ON CONFLICT (course_code) DO NOTHING',
        [course.code, course.title, course.credits, `Sample description for ${course.title}`]
      );
    }
    
    // Insert sample plan items
    const samplePlanItems = [
      { course_code: 'MATH 151', semester: '2024 Fall', notes: 'Required for CS major' },
      { course_code: 'CS 181', semester: '2024 Fall', notes: 'First CS course' },
      { course_code: 'ENG 101', semester: '2024 Fall', notes: 'Writing requirement' },
      { course_code: 'PHYS 150', semester: '2025 Spring', notes: 'Science requirement' },
      { course_code: 'CHEM 111', semester: '2025 Spring', notes: 'Lab science' }
    ];
    
    for (const item of samplePlanItems) {
      await pool.query(
        'INSERT INTO plan_items (plan_id, course_code, semester, notes) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [planId, item.course_code, item.semester, item.notes]
      );
    }
    
    console.log('✅ Sample data inserted successfully!');
    console.log('📊 You can now test the Planning Dashboard with user ID:', userId);
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  insertSampleData();
}

export default insertSampleData;
