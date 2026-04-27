async function test() {
  const res = await fetch('http://localhost:5000/api/progress/goals');
  const goals = await res.json();
  console.log("Goals:", goals);
  
  if (goals.length > 0) {
    const res2 = await fetch('http://localhost:5000/api/progress/goals/' + goals[0]._id, { method: 'DELETE' });
    console.log("Delete status:", res2.status);
    const delData = await res2.json();
    console.log("Delete response:", delData);
  }
}
test();
