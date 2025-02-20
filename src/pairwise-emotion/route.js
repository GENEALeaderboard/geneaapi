import clientPromise from "@/server/mongodb"

export async function GET(req, res) {
  const client = await clientPromise
  const db = client.db("hemvip")

  const studies = await db.collection("studies").find({}).toArray()

  return Response.json(
    { studies: studies, success: true, error: null },
    { status: 200 }
  )
}

export async function POST(req, res) {
  const { csvList, systemType } = await req.json()

  const client = await clientPromise
  const db = client.db("hemvip")
  if (!db) {
    return Response.json(
      {
        success: false,
        msg: "Cannot connect to MongoDB storage.",
        error: null,
      },
      { status: 500 }
    )
  }

  try {
    const update = {
      user_id: userId,
      name: name,
      description: description,
      type: type,
    }

    const result = await db.collection("studies").insertOne(update)
    console.log("result", result)

    if (result.insertedId) {
      return Response.json(
        {
          success: true,
          msg: "Your submission are update successfully.",
          error: null,
        },
        { status: 200 }
      )
    }

    return Response.json(
      {
        success: false,
        msg: "Upload success but failed insert submissions, please contact for support.",
        error: null,
      },
      { status: 500 }
    )
  } catch (error) {
    console.log("Exception: ", error)
    return Response.json(
      {
        success: false,
        msg: "Your submissions is failed, please contact for support.",
        error: error,
      },
      { status: 500 }
    )
  }
}
