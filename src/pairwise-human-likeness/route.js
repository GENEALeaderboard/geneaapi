import clientPromise from "@/server/mongodb"
import { ObjectId } from "bson"

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
  try {
    // ~~~~~~~~~~~~~ Parse Input ~~~~~~~~~~~~~
    const { studiesCSV, systemType } = await req.json()

    // ~~~~~~~~~~~~~ Database Connection ~~~~~~~~~~~~~
    const client = await clientPromise
    const db = client.db("hemvip")
    if (!db) {
      return Response.json(
        {
          success: false,
          message: "Cannot connect to MongoDB storage.",
          error: null,
        },
        { status: 500 }
      )
    }

    // ~~~~~~~~~~~~~ Fetch System Names ~~~~~~~~~~~~~
    let systemNames
    try {
      const systems = await db
        .collection("systems")
        .find({}, { projection: { _id: 0, name: 1 } })
        .toArray()
      systemNames = systems.map((doc) => doc.name)
    } catch (error) {
      console.error("Error fetching systems:", error)
      return Response.json(
        {
          success: false,
          message: "Your request is failed, please contact for support.",
          error: error.message,
        },
        { status: 500 }
      )
    }

    // ~~~~~~~~~~~~~ Fetch Study Config ~~~~~~~~~~~~~
    let studyConfig
    try {
      studyConfig = await db
        .collection("study_config")
        .findOne(
          { type: "pairwise-emotion-studies" },
          { projection: { _id: 0 } }
        )

      console.log("Study Config:", studyConfig)
    } catch (error) {
      console.error("Error fetching study config:", error)
      return Response.json(
        {
          success: false,
          message: "Your request is failed, please contact for support.",
          error: error.message,
        },
        { status: 500 }
      )
    }

    // ~~~~~~~~~~~~~ Define First and Last Pages ~~~~~~~~~~~~~
    const firstPage = {
      type: "generic",
      name: "Startup guide to participate gesture generation study",
      question: "",
      selected: {},
      systems: [],
      actions: [],
      videos: [],
    }

    const lastPage = {
      type: "finish",
      name: "Finish page",
      question: "",
      selected: {},
      systems: [],
      actions: [],
      videos: [],
    }

    // ~~~~~~~~~~~~~ Insert Studies ~~~~~~~~~~~~~
    try {
      const studies = await Promise.all(
        studiesCSV.map(async (studyData) => {
          const pairwises = await Promise.all(
            studyData.map(async (row, index) => {
              const inputcode = row[0]
              const sysA = String(row[1]).trim()
              const sysB = String(row[2]).trim()

              // Fetch videos in parallel
              const [videoA, videoB] = await Promise.all([
                db
                  .collection("videos")
                  .findOne({ inputcode, systemname: sysA }),
                db
                  .collection("videos")
                  .findOne({ inputcode, systemname: sysB }),
              ])

              return {
                type: "video",
                name: `Page ${index + 1} of ${studyData.length}`,
                question:
                  "Pairwise Comparison of Gesture Generation AI Model Studies",
                selected: {},
                actions: [],
                systems: [sysA, sysB],
                videos: [videoA, videoB],
              }
            })
          )

          const { insertedIds } = await db
            .collection("pages")
            .insertMany(pairwises)
          const pageIds = Object.values(insertedIds)

          // Fetch the inserted pages
          const pages = await db
            .collection("pages")
            .find({ _id: { $in: pageIds } })
            .toArray()

          pages.unshift(firstPage)
          pages.push(lastPage)
          console.log("Final Pages:", pages)

          return {
            ...studyConfig,
            pages,
            type: systemType,
            createdat: new Date(),
            time_start: null,
            status: "new",
          }
        })
      )

      const { insertedCount } = await db
        .collection("studies")
        .insertMany(studies)
      console.log("Inserted Studies:", insertedCount)

      if (insertedCount > 0) {
        return Response.json(
          {
            success: true,
            message: "Your studies were successfully generated.",
            error: null,
          },
          { status: 200 }
        )
      }

      return Response.json(
        {
          success: false,
          message: "Your request is failed, please contact for support.",
          error: null,
        },
        { status: 502 }
      )
    } catch (error) {
      console.error("Error inserting studies:", error)
      return Response.json(
        {
          success: false,
          message: "Your request is failed, please contact for support.",
          error: error.message,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected Error:", error)
    return Response.json(
      {
        success: false,
        message: "Your request is failed, please contact for support.",
        error: error.message,
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req, res) {
  const client = await clientPromise
  const db = client.db("hemvip")

  try {
    const { csv } = await req.json()

    if (!csv) {
      return Response.json(
        {
          success: false,
          message: "CSV data is required",
          studies: "",
          error: "CSV data is required",
        },
        { status: 400 }
      )
    }

    const resultQueries = await Promise.all(
      Array.from(csv).map(async (row, index) => {
        const inputcode = row[0]
        const sysA = String(row[1]).replace(/\s+/g, "")
        const sysB = String(row[2]).replace(/\s+/g, "")

        const queryA = { inputcode, systemname: sysA }
        const queryB = { inputcode, systemname: sysB }

        const [rsA, rsB] = await Promise.all([
          db.collection("videos").findOne(queryA),
          db.collection("videos").findOne(queryB),
        ])

        // console.log("rsA", rsA, "rsB", rsB)

        return {
          inputcode: inputcode,
          name1: sysA,
          name2: sysB,
          result1: rsA,
          result2: rsB,
          index: String(index + 1),
        }
      })
    )

    for (const {
      inputcode,
      name1,
      name2,
      result1,
      result2,
      index,
    } of resultQueries) {
      if (!result1 || !result2) {
        let missingNames = []
        if (!result1) missingNames.push(name1)
        if (!result2) missingNames.push(name2)

        return Response.json(
          {
            success: false,
            message: `Video ${inputcode} in line ${index} not found for: ${missingNames.join(", ")}`,
            studies: "",
            error: null,
          },
          { status: 200 }
        )
      }
    }

    return Response.json(
      {
        success: true,
        message: "Video updated successfully",
        studies: "",
        error: null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.log("Error updating video:", error)
    return Response.json(
      {
        success: false,
        message: "Internal Server Error",
        studies: "",
        error,
      },
      { status: 500 }
    )
  }
}
